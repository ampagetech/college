import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()

const VIEW_SCHEMAS = `
Available database views and their columns:

view_tts_users:
- full_name (text) - Student/user full name
- email (text) - Email address
- role (text) - User role (student, teacher, admin)
- status (text) - Account status (active, inactive)
- class (text) - Class/grade level
- joined_date (timestamp) - Registration date
- approved_date (timestamp) - Account approval date

view_tts_fees:
- name (text) - Fee name/title
- description (text) - Fee description
- fee_code (text) - Unique fee identifier
- amount (numeric) - Fee amount in currency
- frequency (text) - Payment frequency (monthly, termly, yearly)
- is_optional (boolean) - Whether fee is optional
- is_active (boolean) - Whether fee is currently active
- date (timestamp) - Fee creation/update date

view_tts_issues:
- title (text) - Issue title
- description (text) - Issue description
- status (text) - Issue status (open, closed, pending)
- priority (text) - Priority level (low, medium, high, urgent)
- type (text) - Issue type/category
- date (timestamp) - Issue creation date

view_tts_subjects:
- name (text) - Subject name
- category (text) - Subject category/department

view_tts_quiz:
- user_name (text) - Student name who took quiz
- subject (text) - Quiz subject
- exam (text) - Exam/quiz name
- exam_year (smallint) - Year of exam
- question_extract_pk (int) - Question ID
- selected_answer (char) - Student's selected answer (A, B, C, D, E)
- correct_answer (char) - Correct answer (A, B, C, D, E)
- is_correct (boolean) - Whether answer was correct
- date (timestamp) - Quiz completion date
- score (numeric) - Quiz score/percentage
- duration_seconds (int) - Time taken in seconds

view_tts_optional_fees_paid_by_students:
- student_name (text) - Student name
- class (text) - Student's class
- fee_name (text) - Name of optional fee
- amount (numeric) - Fee amount
- amount_paid (numeric) - Amount actually paid
- status (text) - Payment status (paid, pending, partial)
- date_paid (timestamp) - Payment date

IMPORTANT RULES:
- Only generate SELECT queries
- Never generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or TRUNCATE
- Use PostgreSQL syntax
- Always use proper column names as listed above
- For boolean columns, use true/false or IS TRUE/IS FALSE
- For text searches, use ILIKE for case-insensitive matching
- Always include reasonable LIMIT clauses for non-aggregate queries (default 50, max 1000)
- Support aggregate functions like COUNT, SUM, AVG, MIN, MAX
- Support GROUP BY, HAVING clauses
- Use proper date formatting for timestamp comparisons
- Format the SQL query cleanly without markdown or code blocks
`;

const EXAMPLE_QUERIES = `
Example query patterns:

"Show me students in Class 6" -> SELECT full_name, class, status FROM view_tts_users WHERE class ILIKE '%6%' AND role = 'student' LIMIT 50;

"How many teachers are there" -> SELECT COUNT(*) as teacher_count FROM view_tts_users WHERE role = 'teacher';

"Count users by role" -> SELECT role, COUNT(*) as count FROM view_tts_users GROUP BY role ORDER BY count DESC;

"Average quiz score by subject" -> SELECT subject, AVG(score) as avg_score FROM view_tts_quiz GROUP BY subject ORDER BY avg_score DESC;

"Total amount of optional fees" -> SELECT SUM(amount) as total_fees FROM view_tts_fees WHERE is_optional = true;

"Optional fees paid by students" -> SELECT student_name, class, fee_name, amount, amount_paid, status FROM view_tts_optional_fees_paid_by_students ORDER BY date_paid DESC LIMIT 50;

"High priority issues" -> SELECT title, description, status, priority, date FROM view_tts_issues WHERE priority = 'high' ORDER BY date DESC LIMIT 50;

"Quiz results with low scores" -> SELECT user_name, subject, exam, score, date FROM view_tts_quiz WHERE score < 50 ORDER BY score ASC LIMIT 50;

"Active fees" -> SELECT name, description, amount, frequency FROM view_tts_fees WHERE is_active = true ORDER BY amount DESC LIMIT 50;

"Count of students by class" -> SELECT class, COUNT(*) as student_count FROM view_tts_users WHERE role = 'student' GROUP BY class ORDER BY student_count DESC;
`;

function isQuerySafe(sql: string): { safe: boolean; reason?: string } {
  const lowered = sql.toLowerCase().trim()
  
  // Remove SQL comments and extra whitespace
  const cleanSql = lowered.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
  
  console.log('Checking SQL safety for:', cleanSql)
  
  if (!cleanSql.startsWith('select')) {
    return { safe: false, reason: 'Only SELECT queries are allowed' }
  }
  
  // Check for multiple statements (semicolons not at the end)
  const semicolonCount = (cleanSql.match(/;/g) || []).length
  if (semicolonCount > 1 || (semicolonCount === 1 && !cleanSql.endsWith(';'))) {
    return { safe: false, reason: 'Multiple SQL statements not allowed' }
  }
  
  // Block dangerous keywords - be more precise to allow aggregate functions
  const dangerousPatterns = [
    /\b(delete|update|insert|drop|create|alter|truncate)\b/i,
    /\b(grant|revoke|exec|execute)\b/i,
    /\b(declare|cursor|procedure|function|trigger)\b/i,
    /\b(create\s+database|drop\s+database|create\s+schema|drop\s+schema)\b/i,
    /\b(create\s+view|drop\s+view|alter\s+view)\b/i,
    /\b(create\s+table|drop\s+table|alter\s+table)\b/i,
    /\b(create\s+index|drop\s+index)\b/i
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleanSql)) {
      const match = cleanSql.match(pattern)
      return { safe: false, reason: `Blocked dangerous SQL pattern: ${match?.[0]}` }
    }
  }
  
  // Ensure we're only querying allowed views
  const allowedViews = [
    'view_tts_users', 'view_tts_fees', 'view_tts_issues', 
    'view_tts_subjects', 'view_tts_quiz', 'view_tts_optional_fees_paid_by_students'
  ]
  
  // Extract table/view names from the query (improved regex)
  const tableReferences = [
    ...Array.from(cleanSql.matchAll(/\bfrom\s+(\w+)/gi), m => m[1]),
    ...Array.from(cleanSql.matchAll(/\bjoin\s+(\w+)/gi), m => m[1])
  ]
  
  for (const table of tableReferences) {
    if (!allowedViews.includes(table.toLowerCase())) {
      console.log(`Referenced table '${table}' not in allowed views:`, allowedViews)
      return { safe: false, reason: `Table/view '${table}' is not allowed. Use only: ${allowedViews.join(', ')}` }
    }
  }
  
  console.log('SQL passed safety checks')
  return { safe: true }
}

function cleanSqlQuery(sql: string): string {
  console.log('Cleaning SQL query:', sql)
  
  // Remove markdown code blocks and extra whitespace
  let cleaned = sql
    .replace(/```sql|```/g, '')
    .replace(/^\s*sql\s*/i, '')
    .replace(/^SQL Query:\s*/i, '')
    .replace(/^Query:\s*/i, '')
    .trim()
  
  console.log('After basic cleaning:', cleaned)
  
  // If multiple lines, join them properly
  const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // If we have multiple lines, try to find the main SELECT statement
  if (lines.length > 1) {
    const selectIndex = lines.findIndex(line => line.toLowerCase().startsWith('select'))
    if (selectIndex !== -1) {
      // Join from the SELECT line onwards
      cleaned = lines.slice(selectIndex).join(' ')
    } else {
      // Join all lines
      cleaned = lines.join(' ')
    }
  }
  
  console.log('After line joining:', cleaned)
  
  // Ensure proper spacing around keywords
  cleaned = cleaned
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/,([^\s])/g, ', $1') // add space after commas
    .trim()
  
  console.log('Final cleaned SQL:', cleaned)
  return cleaned
}

async function generateSqlWithOpenAI(query: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a PostgreSQL expert. Convert natural language questions to SQL queries using only the following database views:

${VIEW_SCHEMAS}

${EXAMPLE_QUERIES}

Guidelines:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax
- Support aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- Support GROUP BY, ORDER BY, HAVING clauses
- For non-aggregate queries, include reasonable LIMIT clauses (default 50, max 1000)
- For aggregate queries (COUNT, SUM, etc.), don't add LIMIT unless specifically requested
- Use ILIKE for case-insensitive text matching
- Handle common variations in question phrasing
- For ambiguous queries, make reasonable assumptions
- Always use proper column names as listed in the schema`
      },
      {
        role: 'user',
        content: `Convert this question to SQL: ${query}`
      }
    ],
    temperature: 0.1,
    max_tokens: 300
  })

  const sql = response.choices[0]?.message?.content?.trim()
  if (!sql) {
    throw new Error('OpenAI failed to generate SQL query')
  }

  return cleanSqlQuery(sql)
}

async function generateSqlWithGemini(query: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.')
  }

  console.log('Initializing Gemini client...')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are a PostgreSQL expert. Convert the following natural language question to a SQL query using only these database views:

${VIEW_SCHEMAS}

${EXAMPLE_QUERIES}

Question: ${query}

Important requirements:
- Return ONLY the SQL query, no markdown, no explanations, no additional text
- Use proper PostgreSQL syntax
- Support all SQL aggregate functions (COUNT, SUM, AVG, MIN, MAX, etc.)
- Support GROUP BY, ORDER BY, HAVING clauses
- For non-aggregate queries, include LIMIT clauses (default 50, max 1000)
- For aggregate queries (COUNT, SUM, etc.), don't add LIMIT unless specifically requested
- Use ILIKE for case-insensitive text searches
- Handle boolean values properly (true/false)
- Make reasonable assumptions for ambiguous queries
- The query must be a valid SELECT statement only
- Always use proper column names as listed in the schema
- For counting queries, use COUNT(*) or COUNT(column_name) appropriately

SQL Query:`

  console.log('Sending prompt to Gemini:', { queryLength: query.length, promptLength: prompt.length })

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 40
      }
    })

    console.log('Received response from Gemini')
    const response = result.response
    
    if (!response) {
      throw new Error('Empty response from Gemini')
    }

    const sql = response.text()?.trim()
    console.log('Raw SQL from Gemini:', sql)
    
    if (!sql) {
      throw new Error('Gemini returned empty SQL query')
    }

    const cleanedSql = cleanSqlQuery(sql)
    console.log('Cleaned SQL:', cleanedSql)
    
    if (!cleanedSql) {
      throw new Error('SQL cleaning resulted in empty query')
    }

    return cleanedSql
    
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key configuration')
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new Error('Gemini API quota exceeded. Please try again later.')
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error connecting to Gemini API')
    } else {
      throw new Error(`Gemini API error: ${error.message}`)
    }
  }
}

// Execute raw SQL directly using Supabase's rpc function
async function executeRawSql(sql: string) {
  console.log('Executing raw SQL:', sql)
  
  try {
    // Use Supabase's rpc to execute raw SQL
    // You'll need to create a function in your database first
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
    
    if (error) {
      console.error('Database error:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err: any) {
    console.error('Raw SQL execution error:', err)
    return { data: null, error: { message: err.message } }
  }
}

// Alternative method using Supabase's SQL execution
async function executeSqlDirect(sql: string) {
  console.log('Executing SQL with direct method:', sql)
  
  try {
    const sqlLower = sql.toLowerCase().trim()
    
    // Handle GROUP BY COUNT queries manually
    if (sqlLower.includes('group by') && sqlLower.includes('count(*)')) {
      console.log('Detected GROUP BY COUNT query, handling manually')
      
      // Parse the specific query pattern: SELECT role, COUNT(*) FROM view_tts_users GROUP BY role
      const groupByMatch = sqlLower.match(/select\s+([\w,\s*()]+)\s+from\s+(\w+)\s+group\s+by\s+(\w+)/)
      if (groupByMatch) {
        const [, selectClause, tableName, groupByColumn] = groupByMatch
        
        // Get all records from the table
        const { data: allRecords, error } = await supabase
          .from(tableName)
          .select(groupByColumn)
        
        if (error) {
          return { data: null, error }
        }
        
        // Group and count manually
        const grouped = allRecords.reduce((acc: Record<string, number>, record: any) => {
          const key = record[groupByColumn] || 'null'
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        
        // Convert to array format expected by the frontend
        const result = Object.entries(grouped).map(([key, count]) => ({
          [groupByColumn]: key === 'null' ? null : key,
          count: count
        }))
        
        console.log('Manual GROUP BY result:', result)
        return { data: result, error: null }
      }
    }
    
    // Handle simple COUNT queries without GROUP BY
    if (sqlLower.includes('count(*)') && !sqlLower.includes('group by')) {
      const fromMatch = sqlLower.match(/from\s+(\w+)/)
      const whereMatch = sqlLower.match(/where\s+(.*?)(?:\s+order|\s+limit|$)/)
      
      if (fromMatch) {
        const table = fromMatch[1]
        let query = supabase.from(table).select('*', { count: 'exact', head: true })
        
        if (whereMatch) {
          const whereClause = whereMatch[1].trim()
          // Handle simple WHERE conditions for COUNT
          if (whereClause.includes('=')) {
            const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/i)
            if (eqMatch) {
              const [, column, value] = eqMatch
              query = query.eq(column, value)
            }
          }
        }
        
        const result = await query
        if (result.error) {
          return { data: null, error: result.error }
        }
        
        // Return count result in expected format
        const countLabel = whereMatch ? 
          `${table.replace('view_tts_', '')}_count` : 
          'count'
        
        return { 
          data: [{ 
            [countLabel]: result.count
          }], 
          error: null 
        }
      }
    }
    
    // For other aggregate queries that we can't handle
    const hasComplexAggregates = /\b(sum|avg|min|max|having)\b/.test(sqlLower)
    if (hasComplexAggregates) {
      return { 
        data: null, 
        error: { 
          message: 'This query requires advanced SQL aggregate functions. Please set up raw SQL execution in your database.' 
        } 
      }
    }
    
    // For non-aggregate queries, use the existing parsing method
    return await executeQueryDirectly(sql, supabase)
    
  } catch (error: any) {
    console.error('SQL execution error:', error)
    return { data: null, error: { message: error.message } }
  }
}

async function executeQueryDirectly(sql: string, supabase: any) {
  console.log('Parsing SQL for direct execution:', sql)
  
  // Simple SQL parser to extract basic query components
  const sqlLower = sql.toLowerCase().trim()
  
  // Extract table/view name
  const fromMatch = sqlLower.match(/from\s+(\w+)/)
  if (!fromMatch) {
    throw new Error('Could not parse table name from SQL query')
  }
  
  const tableName = fromMatch[1]
  console.log('Extracted table name:', tableName)
  
  // Map view names to Supabase table calls
  const viewMap: { [key: string]: string } = {
    'view_tts_users': 'view_tts_users',
    'view_tts_fees': 'view_tts_fees', 
    'view_tts_issues': 'view_tts_issues',
    'view_tts_subjects': 'view_tts_subjects',
    'view_tts_quiz': 'view_tts_quiz',
    'view_tts_optional_fees_paid_by_students': 'view_tts_optional_fees_paid_by_students'
  }
  
  const actualTable = viewMap[tableName]
  if (!actualTable) {
    throw new Error(`Table ${tableName} is not allowed or does not exist`)
  }
  
  // Start building Supabase query
  let query = supabase.from(actualTable)
  
  // Extract SELECT columns
  const selectMatch = sql.match(/select\s+(.*?)\s+from/i)
  if (selectMatch) {
    const selectClause = selectMatch[1].trim()
    if (selectClause !== '*') {
      // Parse column names (basic parsing - handles comma-separated columns)
      const columns = selectClause.split(',').map(col => col.trim())
      const cleanColumns = columns.map(col => {
        // Remove aliases and functions for now - just get basic column names
        return col.replace(/\s+as\s+\w+/i, '').trim()
      }).join(',')
      query = query.select(cleanColumns)
    } else {
      query = query.select('*')
    }
  } else {
    query = query.select('*')
  }
  
  // Extract WHERE clauses (enhanced parsing)
  const whereMatch = sql.match(/where\s+(.*?)(?:\s+order|\s+group|\s+limit|$)/i)
  if (whereMatch) {
    const whereClause = whereMatch[1].trim()
    console.log('WHERE clause found:', whereClause)
    
    // Handle multiple conditions connected by AND/OR
    const conditions = whereClause.split(/\s+and\s+|\s+or\s+/i)
    
    for (const condition of conditions) {
      const conditionTrimmed = condition.trim()
      
      if (conditionTrimmed.includes('ilike')) {
        const ilikeMatch = conditionTrimmed.match(/(\w+)\s+ilike\s+'([^']+)'/i)
        if (ilikeMatch) {
          const [, column, value] = ilikeMatch
          query = query.ilike(column, value)
        }
      } else if (conditionTrimmed.includes('like')) {
        const likeMatch = conditionTrimmed.match(/(\w+)\s+like\s+'([^']+)'/i)
        if (likeMatch) {
          const [, column, value] = likeMatch
          query = query.like(column, value)
        }
      } else if (conditionTrimmed.includes('=')) {
        const eqMatch = conditionTrimmed.match(/(\w+)\s*=\s*'([^']+)'/i)
        if (eqMatch) {
          const [, column, value] = eqMatch
          query = query.eq(column, value)
        }
      } else if (conditionTrimmed.includes('is true')) {
        const boolMatch = conditionTrimmed.match(/(\w+)\s+is\s+true/i)
        if (boolMatch) {
          query = query.eq(boolMatch[1], true)
        }
      } else if (conditionTrimmed.includes('is false')) {
        const boolMatch = conditionTrimmed.match(/(\w+)\s+is\s+false/i)
        if (boolMatch) {
          query = query.eq(boolMatch[1], false)
        }
      } else if (conditionTrimmed.includes('< ') || conditionTrimmed.includes('> ') || conditionTrimmed.includes('<=') || conditionTrimmed.includes('>=')) {
        const compMatch = conditionTrimmed.match(/(\w+)\s*([<>=]+)\s*(\d+)/i)
        if (compMatch) {
          const [, column, operator, value] = compMatch
          const numValue = parseInt(value)
          
          switch (operator) {
            case '<':
              query = query.lt(column, numValue)
              break
            case '>':
              query = query.gt(column, numValue)
              break
            case '<=':
              query = query.lte(column, numValue)
              break
            case '>=':
              query = query.gte(column, numValue)
              break
            case '=':
              query = query.eq(column, numValue)
              break
          }
        }
      }
    }
  }
  
  // Extract ORDER BY
  const orderMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i)
  if (orderMatch) {
    const [, column, direction] = orderMatch
    const ascending = !direction || direction.toLowerCase() === 'asc'
    query = query.order(column, { ascending })
  }
  
  // Extract LIMIT
  const limitMatch = sql.match(/limit\s+(\d+)/i)
  if (limitMatch) {
    const limit = parseInt(limitMatch[1])
    query = query.limit(Math.min(limit, 1000)) // Cap at 1000 for safety
  } else {
    // Only add default limit for non-aggregate queries
    const hasAggregates = /\b(count|sum|avg|min|max|group by)\b/i.test(sqlLower)
    if (!hasAggregates) {
      query = query.limit(50)
    }
  }
  
  console.log('Executing Supabase query...')
  return await query
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, model = 'gemini' } = body
    
    console.log('Natural Language to SQL API called with:', { query, model })
    
    if (!query?.trim()) {
      console.error('No query provided in request')
      return NextResponse.json(
        { error: 'Query is required' }, 
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()
    console.log(`Processing query: "${trimmedQuery}" with model: ${model}`)

    let sql: string

    try {
      console.log(`Calling ${model} API for SQL generation...`)
      
      if (model === 'openai') {
        sql = await generateSqlWithOpenAI(trimmedQuery)
      } else {
        sql = await generateSqlWithGemini(trimmedQuery)
      }
      
      console.log(`Generated SQL from ${model}:`, sql)
      
    } catch (modelError: any) {
      console.error(`${model} generation failed:`, modelError)
      return NextResponse.json({
        error: `Failed to generate SQL using ${model}: ${modelError.message}`,
        details: process.env.NODE_ENV === 'development' ? modelError.stack : undefined
      }, { status: 500 })
    }

    if (!sql) {
      console.error('AI returned empty SQL')
      return NextResponse.json({
        error: 'AI failed to generate a valid SQL query. Please try rephrasing your question.'
      }, { status: 400 })
    }

    console.log(`Validating generated SQL: ${sql}`)

    // Validate the generated SQL
    const safety = isQuerySafe(sql)
    if (!safety.safe) {
      console.error(`Unsafe SQL generated: ${safety.reason}`)
      return NextResponse.json({
        error: `Generated query is not allowed: ${safety.reason}`,
        sql: sql
      }, { status: 400 })
    }

    // Execute the query
    console.log('Executing SQL query against Supabase...')
    const startTime = Date.now()
    
    const { data, error: dbError } = await executeSqlDirect(sql)
    
    const executionTime = Date.now() - startTime
    console.log(`Query executed in ${executionTime}ms`)

    if (dbError) {
      console.error('Database execution error:', dbError)
      
      // Provide more helpful error messages
      let errorMessage = dbError.message
      if (dbError.message?.includes('relation') && dbError.message?.includes('does not exist')) {
        errorMessage = 'The query references tables or views that do not exist. Please check the available data sources.'
      } else if (dbError.message?.includes('syntax error')) {
        errorMessage = 'The generated SQL has syntax errors. Please try rephrasing your question.'
      } else if (dbError.message?.includes('column') && dbError.message?.includes('does not exist')) {
        errorMessage = 'The query references columns that do not exist. Please check your question.'
      } else if (dbError.message?.includes('permission denied')) {
        errorMessage = 'Database permission denied. Please contact support.'
      } else if (dbError.message?.includes('aggregate function')) {
        errorMessage = 'This query requires advanced SQL features. Please set up raw SQL execution support.'
      }

      return NextResponse.json({
        error: errorMessage,
        sql: sql,
        dbError: process.env.NODE_ENV === 'development' ? dbError : undefined
      }, { status: 500 })
    }

    const rowCount = data?.length || 0
    console.log(`Query executed successfully, returned ${rowCount} rows`)

    return NextResponse.json({
      data: data || [],
      sql: sql,
      rowCount: rowCount,
      executionTime: executionTime,
      model: model
    })

  } catch (error: any) {
    console.error('Natural Language to SQL API Error:', error)
    
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred while processing your request',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
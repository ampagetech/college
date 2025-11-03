'use client'

import { useState, useRef, useCallback } from 'react'
import ProgressIndicator from '@/components/common/ProgressIndicator'
import NlSqlHeader from '@/components/natural-lang-to-sql/NlSqlHeader'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table'

type QueryStage = 'idle' | 'listening' | 'transcribing' | 'generating-sql' | 'querying' | 'complete'
type LlmProvider = 'openai' | 'gemini'

export default function TtsSqlPage() {
  const [query, setQuery] = useState('')
  const [sqlModel, setSqlModel] = useState<LlmProvider>('gemini')
  const [transcribeModel, setTranscribeModel] = useState<LlmProvider>('gemini')

  const [stage, setStage] = useState<QueryStage>('idle')
  const [sql, setSql] = useState('')
  const [isEditingSql, setIsEditingSql] = useState(false)
  const [editableSql, setEditableSql] = useState('')
  const [data, setData] = useState<Record<string, any>[]>([])
  const [error, setError] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const abortRef = useRef<AbortController | null>(null)

  const handleQuery = async () => {
    await handleQueryWithText(query.trim())
  }

  const handleQueryWithText = async (queryText: string) => {
    if (!queryText) {
      setError('Please enter a query or use voice input')
      return
    }
    
    console.log('Processing query:', queryText)
    setStage('generating-sql')
    setError('')
    setSql('')
    setData([])
    setIsEditingSql(false)
    setEditableSql('')
    abortRef.current = new AbortController()

    try {
      const requestBody = { 
        query: queryText, 
        model: sqlModel 
      }
      
      console.log('Sending request to API:', requestBody)
      
      const res = await fetch('/api/natural-lang-to-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortRef.current.signal
      })

      console.log('API Response status:', res.status)

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
          console.error('API Error details:', errorData)
        } catch {
          // If JSON parsing fails, use the status text
          const errorText = await res.text()
          errorMessage = errorText || errorMessage
          console.error('API Error text:', errorText)
        }
        throw new Error(errorMessage)
      }
      
      const result = await res.json()
      console.log('API Response data:', result)

      if (!result.sql) {
        throw new Error('No SQL query was generated. Please try rephrasing your question.')
      }

      if (!Array.isArray(result.data)) {
        throw new Error('Invalid data format received from the database.')
      }

      setSql(result.sql)
      setEditableSql(result.sql)
      setData(result.data)
      setStage('complete')

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Query execution error:', err)
        setError(err.message || 'An unexpected error occurred')
        setStage('idle')
      }
    } finally {
      abortRef.current = null
    }
  }

  const handleEditSql = () => {
    setIsEditingSql(true)
    setEditableSql(sql)
  }

  const handleCancelEdit = () => {
    setIsEditingSql(false)
    setEditableSql(sql)
  }

  const handleExecuteCustomSql = async () => {
    if (!editableSql.trim()) {
      setError('Please enter a valid SQL query')
      return
    }

    console.log('Executing custom SQL:', editableSql)
    setStage('querying')
    setError('')
    setData([])
    abortRef.current = new AbortController()

    try {
      // Create a request that directly executes the SQL without NL processing
      const requestBody = { 
        query: `DIRECT_SQL: ${editableSql}`, // Special marker for direct SQL execution
        model: sqlModel 
      }
      
      const res = await fetch('/api/natural-lang-to-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortRef.current.signal
      })

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await res.text()
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      const result = await res.json()

      if (!Array.isArray(result.data)) {
        throw new Error('Invalid data format received from the database.')
      }

      setSql(editableSql)
      setData(result.data)
      setIsEditingSql(false)
      setStage('complete')

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Custom SQL execution error:', err)
        setError(err.message || 'An unexpected error occurred while executing custom SQL')
        setStage('idle')
      }
    } finally {
      abortRef.current = null
    }
  }

  const handleVoiceBlob = async (audioBlob: Blob) => {
    try {
      setStage('transcribing')
      setError('')
      
      const form = new FormData()
      form.append('audio', audioBlob, 'voice.wav')
      form.append('model', transcribeModel)

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: form
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Transcription service unavailable' }))
        throw new Error(errorData.error || `Transcription failed: ${res.statusText}`)
      }

      const data = await res.json()
      
      if (!data.text?.trim()) {
        throw new Error('No speech was detected. Please try speaking more clearly.')
      }

      const transcribedText = data.text.trim()
      setQuery(transcribedText)
      setStage('idle')
      
      // Auto-execute the query after successful transcription
      // Pass the transcribed text directly to avoid race condition
      setTimeout(() => {
        if (transcribedText) {
          handleQueryWithText(transcribedText)
        }
      }, 100)
      
    } catch (e: any) {
      console.error('Transcription failed:', e)
      setError(e.message || 'Voice transcription failed')
      setStage('idle')
    }
  }

  const handleAbort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setStage('idle')
    setIsEditingSql(false)
  }, [])

  const columns: ColumnDef<Record<string, any>>[] = data.length
    ? Object.keys(data[0]).map((key) => ({
        accessorKey: key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        cell: (info) => {
          const val = info.getValue()
          if (val === null || val === undefined) return '—'
          if (typeof val === 'number') {
            return Intl.NumberFormat('en-NG').format(val)
          }
          if (typeof val === 'boolean') {
            return val ? '✓' : '✗'
          }
          return String(val)
        }
      }))
    : []

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const getStageMessage = () => {
    switch (stage) {
      case 'listening': return 'Listening for your voice...'
      case 'transcribing': return 'Converting speech to text...'
      case 'generating-sql': return 'Generating SQL query...'
      case 'querying': return 'Executing query...'
      case 'complete': return 'Query completed successfully!'
      default: return ''
    }
  }

  // Helper function to determine if the process is running
  const isProcessRunning = stage !== 'idle' && stage !== 'complete'

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🎤 Voice Query</h1>
        <p className="text-gray-600 text-sm">Query School Data Using Voice Commands or Text</p>
      </header>

      <NlSqlHeader
        query={query}
        setQuery={setQuery}
        onExecute={handleQuery}
        isRunning={stage !== 'idle'}
        stage={stage}
        sqlModel={sqlModel}
        setSqlModel={setSqlModel}
        transcribeModel={transcribeModel}
        setTranscribeModel={setTranscribeModel}
        onTranscribe={handleVoiceBlob}
        onAbort={handleAbort}
      />

      {/* Progress Indicator */}
      {stage !== 'idle' && (
        <div className="mt-4">
          <ProgressIndicator 
            isRunning={isProcessRunning}
            message={getStageMessage()}
            stage={stage}
          />
        </div>
      )}

      {/* Generated SQL Display */}
      {sql && (
        <div className="bg-white border rounded-lg p-4 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">🧠 Generated SQL</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(sql)}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              >
                📋 Copy
              </button>
              {!isEditingSql && (
                <button
                  onClick={handleEditSql}
                  className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                  disabled={stage !== 'idle' && stage !== 'complete'}
                >
                  ✏️ Edit SQL
                </button>
              )}
            </div>
          </div>
          
          {!isEditingSql ? (
            <pre className="text-sm text-gray-800 bg-gray-50 p-3 rounded overflow-x-auto border">
              {sql}
            </pre>
          ) : (
            <div className="space-y-3">
              <textarea
                value={editableSql}
                onChange={(e) => setEditableSql(e.target.value)}
                rows={6}
                className="w-full text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="Edit your SQL query here..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleExecuteCustomSql}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:bg-gray-400"
                  disabled={stage !== 'idle' && stage !== 'complete'}
                >
                  ▶️ Execute SQL
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mt-4">
          <div className="flex items-start">
            <span className="text-red-500 mr-2">❌</span>
            <div>
              <p className="font-medium">Query Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {data.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-medium text-gray-700">Query Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="text-gray-400">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '↕️'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t">
            <p className="text-xs text-gray-500">
              Showing {data.length} record{data.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
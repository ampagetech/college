// src/hooks/useFocusOnFirstError.ts
import { useEffect, useRef } from 'react';

type Errors = Record<string, string[] | undefined> | null | undefined;

export function useFocusOnFirstError(errors: Errors) {
  // Use a ref to hold a reference to the <form> element
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // If there are no errors, or the form ref isn't attached, do nothing.
    if (!errors || !formRef.current) {
      return;
    }

    // Get the keys of the errors object (e.g., ['surname', 'address'])
    const errorKeys = Object.keys(errors);

    // If there are no keys, do nothing.
    if (errorKeys.length === 0) {
      return;
    }

    // Get the name of the first field that has an error.
    const firstErrorField = errorKeys[0];

    // Find the corresponding input/select/textarea element inside the form.
    // We use a querySelector that finds an element with a `name` attribute matching the key.
    const elementToFocus = formRef.current.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(`[name="${firstErrorField}"]`);

    // If we found an element, focus it and scroll it into view.
    if (elementToFocus) {
      elementToFocus.focus();
      // 'behavior: "smooth"' makes for a nice scrolling animation.
      elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errors]); // This effect runs only when the `errors` object changes.

  return formRef; // Return the ref so we can attach it to our form.
}
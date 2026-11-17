import { useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { useAuthStore } from './stores/authStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  // Guard so the session is restored exactly once, even with StrictMode
  // double-invoking effects in development.
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;
    void initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;

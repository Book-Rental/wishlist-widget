import './App.css'
import '@rentbook/rentbook-ui-lib/microfrontend.min.css'
import WishlistPage from './pages/WishlistPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()
function App() {

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <WishlistPage/>
      </QueryClientProvider>
    </>
  )
}

export default App

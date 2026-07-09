import './App.css'
import '@rentbook/rentbook-ui-lib/microfrontend.min.css'
import WishlistPage from './pages/WishlistPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

type AppProps = {
  userId: string;
};

const queryClient = new QueryClient()
function App({ userId }: AppProps) {

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <WishlistPage userId={userId}/>
      </QueryClientProvider>
    </>
  )
}

export default App

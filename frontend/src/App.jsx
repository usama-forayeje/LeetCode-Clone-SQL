
import { Button } from './components/ui/button'
import { useGetUserQuery } from './querys/useUserQuery';

function App() {
   const { data, isLoading, isError, error } = useGetUserQuery({
    onError: (err) => {
      console.log(err);
      if (err.response?.status === 401) {
        window.location.href = "/login";
      }
    },
  });
  const user = data?.user;
  console.log(user);
  
  return (
    <><h1>Usama Anjuman</h1>
    <Button>Click me</Button>
    </>
  )
}

export default App

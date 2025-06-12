import { useCurrentUser } from './querys/auth';
import AppRouter from './routers/AppRouter';

function App() {
  const { data, isLoading, isError, error } = useCurrentUser({
    onError: (err) => {
      console.log(err);
      if (err.response?.status === 401) {
        window.location.href = "/login";
      }
    },
  });
  const user = data?.user;
  console.log(user);

  if (isLoading) {
    return (
      <div className="w-full flex items-center flex-col justify-center h-screen">
        <span className="loading loading-bars loading-xl"></span>
      </div>
    );
  }

  return (
    <>
      <AppRouter />
    </>

  )
}

export default App

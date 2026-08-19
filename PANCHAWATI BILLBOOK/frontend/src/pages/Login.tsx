import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'Server returned an error');
      } else {
        setError(err.message || 'Network error: Cannot reach server');
      }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl dark:border-zinc-800 dark:bg-black sm:rounded-2xl sm:border sm:shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center dark:border-zinc-800 dark:bg-black sm:px-16">
          <h3 className="text-xl font-semibold dark:text-white">Sign In to BillBook</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Manage your inventory seamlessly</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 dark:bg-zinc-900 sm:px-16">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <label className="block text-xs uppercase text-gray-600 dark:text-zinc-400">Username or Email</label>
            <input
              type="text"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-600 dark:text-zinc-400">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="flex h-10 w-full items-center justify-center rounded-md border border-transparent bg-black px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}


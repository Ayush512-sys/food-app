import { io } from 'socket.io-client';

export const socket = io(import.meta.env.PROD ? 'https://backend-nine-phi-tms0hdue3l.vercel.app' : '/', {
  autoConnect: false, // We will connect it manually in App.tsx or a hook when user logs in
  path: '/socket.io',
});

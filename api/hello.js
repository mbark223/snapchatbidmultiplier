// Simple test endpoint
export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel Function!',
    timestamp: new Date().toISOString()
  });
}
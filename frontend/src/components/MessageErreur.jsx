export default function MessageErreur({ message }) {
  if (!message) return null
  return (
    <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded-lg mb-4">
      ⚠️ {message}
    </div>
  )
}
export default function Header({ title }) {
  return (
    <header className="sticky top-0 z-10 bg-forest text-white px-4 py-3 shadow-md flex items-center">
      <h1 className="text-lg font-semibold truncate">{title}</h1>
    </header>
  )
}

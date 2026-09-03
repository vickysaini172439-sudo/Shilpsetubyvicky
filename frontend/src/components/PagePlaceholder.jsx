// A temporary placeholder used for screens we haven't built yet.
// Once a screen's real feature is built (later phases), we replace
// its page file's content — this component then stops being used there.
export default function PagePlaceholder({ title, phase, description }) {
  return (
    <div className="p-6 text-center mt-10">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-xl font-semibold text-forest mb-2">{title}</h2>
      <p className="text-gray-600 mb-1">{description}</p>
      <p className="text-sm text-sand font-medium">Coming in {phase}</p>
    </div>
  )
}

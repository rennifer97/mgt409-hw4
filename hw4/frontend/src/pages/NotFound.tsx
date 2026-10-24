import { Link } from 'react-router-dom'
import usePageTitle from '../usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <section className="section">
      <h1>Page not found</h1>
      <Link to="/">← Back home</Link>
    </section>
  )
}

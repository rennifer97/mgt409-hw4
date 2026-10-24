import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { PHOTOS } from '../lib/catalog'
import usePageTitle from '../usePageTitle'

export default function About() {
  usePageTitle('About Us')
  return (
    <>
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <p className="eyebrow">About Campus Customs</p>
          <h1 id="about-title" className="display">
            A New Haven shop with <em>Bulldog blue</em> in its blood.
          </h1>
        </div>
        <img src={PHOTOS.dan.src} alt={PHOTOS.dan.alt} />
      </section>

      <section className="section prose">
        <Reveal>
          <p className="lead">
            Campus Customs sits at 57 Broadway, a few steps from Old Campus. We help students, families, alumni, and
            fans find Yale gear that feels as good as it looks.
          </p>
        </Reveal>
        <Reveal>
          <h2 className="display small">Made for your first day, and every one after.</h2>
          <p>
            Getting into Yale is a big deal, and the first sweatshirt you wear across Old Campus should feel like it.
            We keep it simple: comfortable clothes, classic Yale marks, and friendly help. A hoodie for finals week, a
            residential college quarter-zip, a tee for The Game, a gift for the proud parent. We stock all of it.
          </p>
        </Reveal>
        <Reveal>
          <div className="about-stats">
            <div>
              <strong>102</strong>
              <span>styles in stock</span>
            </div>
            <div>
              <strong>11</strong>
              <span>residential colleges</span>
            </div>
            <div>
              <strong>XS–XXL</strong>
              <span>sizes in every style</span>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="display small">Officially licensed</h2>
          <p>
            Every item we carry is officially licensed. When you shop with us, you’re wearing the real thing and
            supporting a local store in the heart of campus.
          </p>
          <h2 className="display small">Visit us</h2>
          <p>
            57 Broadway, New Haven, CT 06511. Stop by in person, or shop online and ask our concierge anything about
            sizes and stock.
          </p>
          <Link to="/products?collection=welcome" className="btn">
            Shop the Welcome Collection
          </Link>
        </Reveal>
      </section>
    </>
  )
}

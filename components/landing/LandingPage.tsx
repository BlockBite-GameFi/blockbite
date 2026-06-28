import { Topbar } from './Topbar';
import { Hero } from './Hero';
import { Pillars } from './Pillars';
import { HowItWorks } from './HowItWorks';
import { Demo } from './Demo';
import { CallToAction } from './CallToAction';
import { FAQ } from './FAQ';
import { Waitlist } from './Waitlist';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <>
      <Topbar />
      <Hero />
      <div className="lp-content-zone">
        <Pillars />
        <HowItWorks />
        <Demo />
        <CallToAction />
        <FAQ />
        <Waitlist />
      </div>
      <Footer />
    </>
  );
}

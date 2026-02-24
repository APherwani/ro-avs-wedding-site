import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import OurStory from "@/components/OurStory";
import Events from "@/components/Events";
import Gallery from "@/components/Gallery";
import Venue from "@/components/Venue";
import RSVP from "@/components/RSVP";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <OurStory />
      <Events />
      <Gallery />
      <Venue />
      <RSVP />
      <Footer />
    </>
  );
}

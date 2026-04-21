import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Vision from './components/Vision';
import CurrentSolution from './components/CurrentSolution';
import UpcomingProducts from './components/UpcomingProducts';
import WhyUs from './components/WhyUs';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Vision />
        <CurrentSolution />
        <UpcomingProducts />
        <WhyUs />
        <ContactUs />
      </main>
      <Footer />
    </>
  );
}

export default App;

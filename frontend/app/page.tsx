import FeedbackForm from '@/components/FeedbackForm';
import { AnimatedTitle } from '@/components/animated-title';
import { HomeStyles as styles } from '@/styles/homeStyles';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Decorative background elements that adapt to theme */}
      <div className={styles.decorationTop} />
      <div className={styles.decorationBottom} />

      <div className={styles.titleContainer}>
        <AnimatedTitle />
       
      </div>

      <div className={styles.formContainer}>
        <FeedbackForm />
      </div>
      
      <footer className={styles.footer}>
        © {new Date().getFullYear()} | FeedPulse Enterprise Platform
      </footer>
    </main>
  );
}

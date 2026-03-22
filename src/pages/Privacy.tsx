import Navbar from "@/components/Navbar";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Last updated:</strong> March 2026</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your email address, username, and any content you create or share through Alter AI.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve our services, process transactions, send notifications, and ensure platform security.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">3. Data Storage</h2>
          <p>Your data is stored securely using industry-standard encryption. Chat messages and generated content are associated with your account.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">4. Third-Party Services</h2>
          <p>We use third-party services including Stripe for payment processing and AI model providers for chat and image generation. These services have their own privacy policies.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Voice Data</h2>
          <p>Alter AI offers optional voice features including speech-to-text (voice input) and text-to-speech (voice output). When you use these features:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Speech-to-text processing is handled locally in your browser using the Web Speech API. We do not record, store, or transmit your raw audio.</li>
            <li>Text-to-speech playback is performed locally in your browser. No voice audio is sent to our servers.</li>
            <li>If you upload a custom voice sample, the file is stored locally in your browser session only and is not uploaded to our servers. It is discarded when you close the page or clear your settings.</li>
            <li>Your voice preference settings (selected voice, enabled/disabled status) may be stored locally on your device.</li>
          </ul>
          <p>We do not sell, share, or use voice data for training purposes. Voice features are entirely optional and can be disabled at any time from the chat interface.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Your Rights</h2>
          <p>You can request access to, correction of, or deletion of your personal data by contacting us. You may also export your data at any time.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">7. Contact</h2>
          <p>For privacy-related questions, please reach out through our platform.</p>
        </div>
      </div>
    </div>
  );
}

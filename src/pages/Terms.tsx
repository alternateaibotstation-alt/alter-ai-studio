import Navbar from "@/components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Last updated:</strong> March 2026</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
          <p>By accessing or using Alter AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">2. Account Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account and for all activities that occur under your account. You must provide accurate information during registration.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">3. Acceptable Use</h2>
          <p>You agree not to use Alter AI for any unlawful purpose, to harass others, to distribute harmful content, or to attempt to circumvent usage limits or security measures.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">4. Subscriptions & Payments</h2>
          <p>Paid subscriptions are billed monthly through Stripe. You may cancel at any time through the subscription management portal. Refunds are handled on a case-by-case basis.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">5. Content Ownership</h2>
          <p>You retain ownership of content you create using Alter AI. By using our platform, you grant us a limited license to store and process your content to provide our services.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">6. AI-Generated Content</h2>
          <p>AI responses and generated images are provided as-is. We do not guarantee accuracy, appropriateness, or fitness for any particular purpose.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">7. Voice Features</h2>
          <p>Alter AI provides optional voice interaction features:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Speech-to-Text:</strong> You may use your device microphone to dictate messages. This uses your browser's built-in speech recognition and does not transmit audio to Alter AI servers.</li>
            <li><strong className="text-foreground">Text-to-Speech:</strong> Bot responses can be read aloud using your browser's speech synthesis. You may select from available system voices or upload a custom audio sample.</li>
            <li><strong className="text-foreground">Custom Voice Uploads:</strong> Any voice sample you upload is processed locally in your browser and is not stored on our servers. You represent that you have the right to use any voice sample you upload and that it does not infringe on any third-party rights, including personality or publicity rights.</li>
            <li><strong className="text-foreground">No Voice Cloning:</strong> Alter AI does not perform AI voice cloning. Custom voice uploads are played as reference audio alongside text-to-speech output, not used to synthesize new speech.</li>
          </ul>
          <p>You are responsible for ensuring that your use of voice features complies with applicable laws, including consent and recording laws in your jurisdiction.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">8. Limitation of Liability</h2>
          <p>Alter AI is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">9. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </div>
      </div>
    </div>
  );
}

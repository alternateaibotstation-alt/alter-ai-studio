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
          
          <h2 className="text-xl font-semibold text-foreground mt-8">5. Your Rights</h2>
          <p>You can request access to, correction of, or deletion of your personal data by contacting us. You may also export your data at any time.</p>
          
          <h2 className="text-xl font-semibold text-foreground mt-8">6. Contact</h2>
          <p>For privacy-related questions, please reach out through our platform.</p>
        </div>
      </div>
    </div>
  );
}

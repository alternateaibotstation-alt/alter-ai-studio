import { Navbar } from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is Alterai.im?",
    a: "Alterai.im is a creator-first AI platform for building AI companions, generating multi-platform content (TikTok, Instagram, YouTube, etc.), producing voiceovers, and selling templates — all from one dashboard.",
  },
  {
    q: "Do I need an API key to use it?",
    a: "No. All AI models are managed internally through our backend. You don't need an OpenAI, Gemini, or ElevenLabs key to start creating.",
  },
  {
    q: "How does pricing work?",
    a: "We offer a Free tier to try the platform, plus Pro and Power tiers billed monthly through Stripe. Each tier increases your message, image, and video generation limits. See the Pricing page for current rates.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can manage or cancel your subscription anytime from the Profile page via the Stripe customer portal. Cancellation takes effect at the end of your current billing period.",
  },
  {
    q: "Do you offer refunds?",
    a: "Subscription payments are non-refundable once the billing period has started, except where required by law. One-off bot purchases may be refunded within 7 days if the bot is non-functional. See our Payment & Refund Policy for details.",
  },
  {
    q: "Who owns the content I generate?",
    a: "You own the content you generate, subject to our Terms of Service and Content Policy. We don't watermark or claim rights to your output.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your creations, chats, and templates are stored privately and protected by row-level security. We never sell personal data. See our Privacy Policy for full details.",
  },
  {
    q: "What content is not allowed?",
    a: "We strictly prohibit illegal, sexually explicit, harmful, hateful, or platform-policy-violating content (especially TikTok). See the Content Policy and Acceptable Use Policy.",
  },
  {
    q: "Can I sell templates or bots?",
    a: "Yes. The Templates Marketplace and Bot Marketplace let approved creators publish and monetize. Revenue share and payout terms are in the Payment Policy.",
  },
  {
    q: "How do I report a bug or get support?",
    a: "Email alternateaibotstation@gmail.com. We respond within 1–2 business days.",
  },
  {
    q: "Who runs Alterai.im?",
    a: "Alterai.im is solely owned and operated by Carley Lenon.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-8">
          Quick answers about Alterai.im, billing, content rights, and policies.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-foreground">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="text-sm text-muted-foreground mt-10">
          Still need help? Email{" "}
          <a className="text-primary hover:underline" href="mailto:alternateaibotstation@gmail.com">
            alternateaibotstation@gmail.com
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
};

export default FAQ;

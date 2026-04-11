import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Wand2, Shuffle, Download } from "lucide-react";

const formats = ["TikTok Video", "Image Post", "Carousel", "Reel", "Story"];

export default function ContentCreator() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-center">Content Creator Engine</h1>

        {/* Format Selector */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Choose Format</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {formats.map((type) => (
                <Button key={type} variant="outline" className="w-full">
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Output */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
            <TabsTrigger value="caption">Caption</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="aspect-[9/16] max-w-xs mx-auto rounded-xl bg-muted flex items-center justify-center border border-border">
                    <p className="text-muted-foreground text-sm">Generated Video/Image Preview</p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompt">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Ready-to-copy AI generation prompt appears here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="caption">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Final caption + hashtags appear here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button className="gap-2"><Wand2 className="w-4 h-4" /> Generate</Button>
          <Button variant="secondary" className="gap-2"><Shuffle className="w-4 h-4" /> Remix</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
        </div>
      </div>
    </div>
  );
}

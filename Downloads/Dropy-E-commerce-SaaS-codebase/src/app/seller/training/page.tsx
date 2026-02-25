"use client";

import { GraduationCap, PlayCircle, BookOpen, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TrainingPage() {
  const courses = [
    {
      title: "Introduction au Dropshipping en Tunisie",
      description: "Apprenez les bases du e-commerce et comment lancer votre première boutique.",
      duration: "45 min",
      lessons: 8,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop"
    },
    {
      title: "Optimiser vos Publicités Facebook",
      description: "Techniques avancées pour attirer des clients et maximiser votre ROI.",
      duration: "1h 30min",
      lessons: 12,
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop"
    },
    {
      title: "Gestion de la Relation Client",
      description: "Comment fidéliser vos clients et gérer les retours efficacement.",
      duration: "30 min",
      lessons: 5,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Formation</h1>
          <p className="text-muted-foreground">Apprenez à développer votre business avec nos experts.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">0 Points gagnés</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.title} className="overflow-hidden group cursor-pointer hover:border-primary transition-colors">
            <div className="aspect-video overflow-hidden">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {course.lessons} leçons
                </div>
              </div>
              <Button className="w-full mt-4 gap-2">
                <PlayCircle className="w-4 h-4" />
                Démarrer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

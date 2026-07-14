import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useCreateVisit, useGetPatient, getGetPatientQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Upload, ArrowLeft, Activity, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fileToBase64 } from "@/lib/image-utils";

const formSchema = z.object({
  symptoms: z.string().min(5, "Please describe the symptoms in more detail (at least 5 characters)."),
  medications: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TriageForm() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const createVisit = useCreateVisit();
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: patient } = useGetPatient(id, { 
    query: { enabled: !!id, queryKey: getGetPatientQueryKey(id) } 
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: "",
      medications: "",
    },
  });

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setPhotoPreview(base64);
      setPhotoBase64(base64);
    } catch (error) {
      console.error("Failed to read image", error);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: FormValues) => {
    createVisit.mutate({
      id,
      data: {
        symptoms: values.symptoms,
        medications: values.medications || undefined,
        photoBase64: photoBase64,
      }
    }, {
      onSuccess: (visit) => {
        setLocation(`/visits/${visit.id}`);
      }
    });
  };

  if (createVisit.isPending) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <Activity className="w-16 h-16 text-primary animate-bounce relative z-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyzing Case...</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            MamaCare AI is reviewing symptoms and guidelines to provide the safest recommendation.
          </p>
        </div>
        <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-4 overflow-hidden">
          <div className="bg-primary h-full w-2/3 animate-[progress_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
      </Button>

      <Card className="border-border shadow-md overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-secondary" />
            New Triage Case
          </CardTitle>
          <CardDescription className="text-primary-foreground/80 text-base">
            {patient ? `Patient: ${patient.name}` : "Loading patient..."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Photo Upload Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-medium leading-none">Clinical Photo (Optional)</label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Take a clear photo of the visible symptom (e.g., rash, swelling, pallor).
                </p>

                {!photoPreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-colors group"
                  >
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7" />
                    </div>
                    <p className="font-semibold text-foreground text-lg mb-1">Tap to capture photo</p>
                    <p className="text-sm text-muted-foreground">Or upload from gallery</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-border shadow-sm group">
                    <img src={photoPreview} alt="Symptom preview" className="w-full h-auto max-h-[300px] object-contain bg-black/5" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="destructive" size="sm" onClick={removePhoto} className="font-bold">
                        <X className="w-4 h-4 mr-2" /> Remove Photo
                      </Button>
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoCapture}
                />
              </div>

              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-foreground font-bold">Describe Symptoms *</FormLabel>
                    <FormDescription>
                      Include onset time, severity, and any vital signs if available.
                    </FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g. Fever for 3 days, vomiting everything she eats, lethargic..." 
                        className="min-h-[120px] text-base resize-y bg-card" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold text-foreground">Current Medications (Optional)</FormLabel>
                    <FormDescription>
                      List any drugs given or available. The AI will provide dosage guidance.
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Paracetamol, ACT" 
                        className="h-12 text-base" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-border">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg font-bold h-14 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                >
                  <Activity className="w-6 h-6 mr-2" />
                  Analyze Case
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Powered by MamaCare AI Protocol
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Add keyframes in index.css for the progress bar if not present, but Tailwind can handle basic animations

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreatePatient } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  ageYears: z.coerce.number().min(0).max(120).optional().or(z.literal("")),
  weightKg: z.coerce.number().min(0.1).max(300).optional().or(z.literal("")),
  sex: z.string().optional(),
  village: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PatientNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPatient = useCreatePatient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ageYears: "",
      weightKg: "",
      sex: "",
      village: "",
      phoneNumber: "",
    },
  });

  function onSubmit(values: FormValues) {
    // Clean up empty strings to undefined for optional fields
    const data = {
      ...values,
      ageYears: values.ageYears === "" ? undefined : Number(values.ageYears),
      weightKg: values.weightKg === "" ? undefined : Number(values.weightKg),
      sex: values.sex || undefined,
      village: values.village || undefined,
      phoneNumber: values.phoneNumber || undefined,
    };

    createPatient.mutate({ data }, {
      onSuccess: (patient) => {
        toast({
          title: "Patient registered",
          description: `${patient.name} has been added to the registry.`,
        });
        setLocation(`/patients/${patient.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to register patient. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card className="border-border shadow-md">
        <CardHeader className="bg-primary/5 border-b border-border pb-6">
          <CardTitle className="text-2xl">Register New Patient</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Enter the demographic details for the new patient.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Amina Bello" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ageYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (Years)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 24" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g. 65.5" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g. 08012345678" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="village"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village / Community</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter village name" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full sm:w-auto text-base font-bold bg-primary hover:bg-primary/90"
                  disabled={createPatient.isPending}
                >
                  {createPatient.isPending ? (
                    "Registering..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

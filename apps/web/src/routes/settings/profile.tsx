import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Building2,
  Camera,
  Mail,
  MapPin,
  Phone,
  Save,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";
import { SettingsLayout } from "@/components/settings-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/profile")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [profileData, setProfileData] = useState({
    firstName: session.data?.user?.firstName || "",
    lastName: session.data?.user?.lastName || "",
    email: session.data?.user?.email || "",
    phone: "",
    title: "Tax Consultant",
    company: "GK-Nexus Tax Services",
    bio: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
    professionalInfo: {
      license: "",
      specializations: ["Tax Preparation", "Business Consulting"],
      yearsExperience: "5",
    },
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [section, key] = field.split(".");
      setProfileData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [key]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUploading(false);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-2xl">Profile Settings</h2>
          <p className="text-muted-foreground">
            Manage your personal information and professional details.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Photo
              </CardTitle>
              <CardDescription>
                Upload a professional photo for your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage alt="Profile photo" src="" />
                  <AvatarFallback className="text-lg">
                    {profileData.firstName[0]}
                    {profileData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="photo-upload">
                    Upload new photo (JPG, PNG up to 5MB)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={isUploading}
                      onClick={() =>
                        document.getElementById("photo-upload")?.click()
                      }
                      size="sm"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Choose File"}
                    </Button>
                    <input
                      accept="image/*"
                      className="hidden"
                      id="photo-upload"
                      onChange={handleFileUpload}
                      type="file"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your personal and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    value={profileData.firstName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    value={profileData.lastName}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor="email">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    type="email"
                    value={profileData.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor="phone">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                    value={profileData.phone}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself and your expertise..."
                  rows={4}
                  value={profileData.bio}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Professional Information
              </CardTitle>
              <CardDescription>
                Your professional credentials and experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    value={profileData.title}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                    value={profileData.company}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo.license",
                        e.target.value
                      )
                    }
                    placeholder="e.g., CPA-123456"
                    value={profileData.professionalInfo.license}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange(
                        "professionalInfo.yearsExperience",
                        value
                      )
                    }
                    value={profileData.professionalInfo.yearsExperience}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1-2 years</SelectItem>
                      <SelectItem value="3">3-5 years</SelectItem>
                      <SelectItem value="6">6-10 years</SelectItem>
                      <SelectItem value="10">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
              <CardDescription>
                Your business or personal address information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  onChange={(e) =>
                    handleInputChange("address.street", e.target.value)
                  }
                  placeholder="123 Main Street"
                  value={profileData.address.street}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    onChange={(e) =>
                      handleInputChange("address.city", e.target.value)
                    }
                    value={profileData.address.city}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("address.state", value)
                    }
                    value={profileData.address.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny">New York</SelectItem>
                      <SelectItem value="ca">California</SelectItem>
                      <SelectItem value="fl">Florida</SelectItem>
                      <SelectItem value="tx">Texas</SelectItem>
                      {/* Add more states as needed */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    onChange={(e) =>
                      handleInputChange("address.zipCode", e.target.value)
                    }
                    placeholder="10001"
                    value={profileData.address.zipCode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("address.country", value)
                    }
                    value={profileData.address.country}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">
                        United States
                      </SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">
                        United Kingdom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Camera,
  CreditCard,
  Edit2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/portal/profile")({
  component: ProfilePage,
});

interface UserProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    avatar: string;
  };
  business: {
    companyName: string;
    registrationNumber: string;
    businessType: string;
    industry: string;
    establishedDate: string;
    employeeCount: string;
    website: string;
  };
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  tax: {
    tin: string;
    nis: string;
    vatRegistered: boolean;
    vatNumber: string;
    payeNumber: string;
  };
  account: {
    accountType: string;
    memberSince: string;
    lastLogin: string;
    status: string;
  };
}

const defaultUserData: UserProfile = {
  personal: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "(592) 555-0123",
    dateOfBirth: "1985-03-15",
    nationality: "Guyanese",
    avatar: "",
  },
  business: {
    companyName: "Smith Enterprises Ltd.",
    registrationNumber: "GY123456789",
    businessType: "Private Limited Company",
    industry: "Professional Services",
    establishedDate: "2015-08-01",
    employeeCount: "10-25",
    website: "www.smithenterprises.gy",
  },
  address: {
    street: "123 Main Street",
    city: "Georgetown",
    region: "region-4",
    postalCode: "00001",
    country: "Guyana",
  },
  tax: {
    tin: "123456789",
    nis: "987654321",
    vatRegistered: true,
    vatNumber: "VAT123456789",
    payeNumber: "PAYE987654321",
  },
  account: {
    accountType: "Premium Client",
    memberSince: "2020-01-15",
    lastLogin: new Date().toISOString(),
    status: "Active",
  },
};

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(defaultUserData);

  // Fetch user profile from API
  const { data: userResponse, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.users.me();
    },
  });

  // Initialize form data from API response
  useEffect(() => {
    if (userResponse?.data) {
      const userData = userResponse.data;
      const nameParts = (userData.name || "").split(" ");
      setFormData({
        personal: {
          firstName: nameParts[0] || defaultUserData.personal.firstName,
          lastName:
            nameParts.slice(1).join(" ") || defaultUserData.personal.lastName,
          email: userData.email || defaultUserData.personal.email,
          phone: defaultUserData.personal.phone,
          dateOfBirth: defaultUserData.personal.dateOfBirth,
          nationality: defaultUserData.personal.nationality,
          avatar: (userData as { image?: string }).image || "",
        },
        business: defaultUserData.business,
        address: defaultUserData.address,
        tax: defaultUserData.tax,
        account: {
          accountType: userData.role || "Client",
          memberSince:
            (userData as { createdAt?: string }).createdAt ||
            defaultUserData.account.memberSince,
          lastLogin: new Date().toISOString(),
          status: "Active",
        },
      });
    }
  }, [userResponse]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    if (userResponse?.data) {
      const userData = userResponse.data;
      const nameParts = (userData.name || "").split(" ");
      setFormData({
        ...formData,
        personal: {
          ...formData.personal,
          firstName: nameParts[0] || defaultUserData.personal.firstName,
          lastName:
            nameParts.slice(1).join(" ") || defaultUserData.personal.lastName,
          email: userData.email || defaultUserData.personal.email,
        },
      });
    }
    setIsEditing(false);
  };
  const handleSave = () => {
    // In real app, this would send data to API
    setIsEditing(false);
  };

  const updateFormData = (
    section: keyof typeof formData,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl text-foreground">
            Profile Management
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and business details
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button aria-label="Save changes" onClick={handleSave} size="sm">
                <Save aria-hidden="true" className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button
                aria-label="Cancel editing"
                onClick={handleCancel}
                size="sm"
                variant="outline"
              >
                <X aria-hidden="true" className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button aria-label="Edit profile" onClick={handleEdit} size="sm">
              <Edit2 aria-hidden="true" className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  alt={`${formData.personal.firstName} ${formData.personal.lastName}`}
                  src={formData.personal.avatar}
                />
                <AvatarFallback className="text-2xl">
                  {formData.personal.firstName[0]}
                  {formData.personal.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  aria-label="Change profile picture"
                  className="-bottom-2 -right-2 absolute h-8 w-8 rounded-full p-0"
                  size="sm"
                >
                  <Camera aria-hidden="true" className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <h2 className="font-semibold text-2xl text-foreground">
                  {formData.personal.firstName} {formData.personal.lastName}
                </h2>
                <Badge
                  variant={
                    formData.account.status === "Active"
                      ? "default"
                      : "secondary"
                  }
                >
                  {formData.account.status}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                {formData.business.companyName}
              </p>
              <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                <div className="flex items-center space-x-1">
                  <Mail aria-hidden="true" className="h-4 w-4" />
                  <span>{formData.personal.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  <span>{formData.personal.phone}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar aria-hidden="true" className="h-4 w-4" />
                  <span>
                    Member since{" "}
                    {new Date(formData.account.memberSince).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Content */}
      <Tabs className="space-y-6" defaultValue="personal">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger className="flex items-center space-x-2" value="personal">
            <User aria-hidden="true" className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="business">
            <Building2 aria-hidden="true" className="h-4 w-4" />
            <span>Business</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="tax">
            <CreditCard aria-hidden="true" className="h-4 w-4" />
            <span>Tax Info</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="account">
            <Shield aria-hidden="true" className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User aria-hidden="true" className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="firstName-help"
                      id="firstName"
                      onChange={(e) =>
                        updateFormData("personal", "firstName", e.target.value)
                      }
                      value={formData.personal.firstName}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.personal.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="lastName-help"
                      id="lastName"
                      onChange={(e) =>
                        updateFormData("personal", "lastName", e.target.value)
                      }
                      value={formData.personal.lastName}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.personal.lastName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="email-help"
                      id="email"
                      onChange={(e) =>
                        updateFormData("personal", "email", e.target.value)
                      }
                      type="email"
                      value={formData.personal.email}
                    />
                  ) : (
                    <p className="text-foreground">{formData.personal.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="phone-help"
                      id="phone"
                      onChange={(e) =>
                        updateFormData("personal", "phone", e.target.value)
                      }
                      value={formData.personal.phone}
                    />
                  ) : (
                    <p className="text-foreground">{formData.personal.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="dob-help"
                      id="dateOfBirth"
                      onChange={(e) =>
                        updateFormData(
                          "personal",
                          "dateOfBirth",
                          e.target.value
                        )
                      }
                      type="date"
                      value={formData.personal.dateOfBirth}
                    />
                  ) : (
                    <p className="text-foreground">
                      {new Date(
                        formData.personal.dateOfBirth
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  {isEditing ? (
                    <Select
                      onValueChange={(value) =>
                        updateFormData("personal", "nationality", value)
                      }
                      value={formData.personal.nationality}
                    >
                      <SelectTrigger
                        aria-describedby="nationality-help"
                        id="nationality"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guyanese">Guyanese</SelectItem>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="Canadian">Canadian</SelectItem>
                        <SelectItem value="British">British</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground">
                      {formData.personal.nationality}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin aria-hidden="true" className="h-5 w-5" />
                <span>Address Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="street-help"
                      id="street"
                      onChange={(e) =>
                        updateFormData("address", "street", e.target.value)
                      }
                      value={formData.address.street}
                    />
                  ) : (
                    <p className="text-foreground">{formData.address.street}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="city-help"
                      id="city"
                      onChange={(e) =>
                        updateFormData("address", "city", e.target.value)
                      }
                      value={formData.address.city}
                    />
                  ) : (
                    <p className="text-foreground">{formData.address.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  {isEditing ? (
                    <Select
                      onValueChange={(value) =>
                        updateFormData("address", "region", value)
                      }
                      value={formData.address.region}
                    >
                      <SelectTrigger aria-describedby="region-help" id="region">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="region-1">
                          Region 1 - Barima-Waini
                        </SelectItem>
                        <SelectItem value="region-2">
                          Region 2 - Pomeroon-Supenaam
                        </SelectItem>
                        <SelectItem value="region-3">
                          Region 3 - Essequibo Islands-West Demerara
                        </SelectItem>
                        <SelectItem value="region-4">
                          Region 4 - Demerara-Mahaica
                        </SelectItem>
                        <SelectItem value="region-5">
                          Region 5 - Mahaica-Berbice
                        </SelectItem>
                        <SelectItem value="region-6">
                          Region 6 - East Berbice-Corentyne
                        </SelectItem>
                        <SelectItem value="region-7">
                          Region 7 - Cuyuni-Mazaruni
                        </SelectItem>
                        <SelectItem value="region-8">
                          Region 8 - Potaro-Siparuni
                        </SelectItem>
                        <SelectItem value="region-9">
                          Region 9 - Upper Takutu-Upper Essequibo
                        </SelectItem>
                        <SelectItem value="region-10">
                          Region 10 - Upper Demerara-Berbice
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground">{formData.address.region}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="postal-help"
                      id="postalCode"
                      onChange={(e) =>
                        updateFormData("address", "postalCode", e.target.value)
                      }
                      value={formData.address.postalCode}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.address.postalCode}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="country-help"
                      id="country"
                      onChange={(e) =>
                        updateFormData("address", "country", e.target.value)
                      }
                      value={formData.address.country}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.address.country}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 aria-hidden="true" className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="company-help"
                      id="companyName"
                      onChange={(e) =>
                        updateFormData(
                          "business",
                          "companyName",
                          e.target.value
                        )
                      }
                      value={formData.business.companyName}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.business.companyName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Registration Number
                  </Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="reg-help"
                      id="registrationNumber"
                      onChange={(e) =>
                        updateFormData(
                          "business",
                          "registrationNumber",
                          e.target.value
                        )
                      }
                      value={formData.business.registrationNumber}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.business.registrationNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  {isEditing ? (
                    <Select
                      onValueChange={(value) =>
                        updateFormData("business", "businessType", value)
                      }
                      value={formData.business.businessType}
                    >
                      <SelectTrigger
                        aria-describedby="business-type-help"
                        id="businessType"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private Limited Company">
                          Private Limited Company
                        </SelectItem>
                        <SelectItem value="Sole Proprietorship">
                          Sole Proprietorship
                        </SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Non-Profit Organization">
                          Non-Profit Organization
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground">
                      {formData.business.businessType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="industry-help"
                      id="industry"
                      onChange={(e) =>
                        updateFormData("business", "industry", e.target.value)
                      }
                      value={formData.business.industry}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.business.industry}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedDate">Established Date</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="established-help"
                      id="establishedDate"
                      onChange={(e) =>
                        updateFormData(
                          "business",
                          "establishedDate",
                          e.target.value
                        )
                      }
                      type="date"
                      value={formData.business.establishedDate}
                    />
                  ) : (
                    <p className="text-foreground">
                      {new Date(
                        formData.business.establishedDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Employee Count</Label>
                  {isEditing ? (
                    <Select
                      onValueChange={(value) =>
                        updateFormData("business", "employeeCount", value)
                      }
                      value={formData.business.employeeCount}
                    >
                      <SelectTrigger
                        aria-describedby="employee-help"
                        id="employeeCount"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1-5</SelectItem>
                        <SelectItem value="6-10">6-10</SelectItem>
                        <SelectItem value="10-25">10-25</SelectItem>
                        <SelectItem value="25-50">25-50</SelectItem>
                        <SelectItem value="50+">50+</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground">
                      {formData.business.employeeCount} employees
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="website-help"
                      id="website"
                      onChange={(e) =>
                        updateFormData("business", "website", e.target.value)
                      }
                      value={formData.business.website}
                    />
                  ) : (
                    <p className="text-foreground">
                      {formData.business.website}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard aria-hidden="true" className="h-5 w-5" />
                <span>Tax Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="tin-help"
                      id="tin"
                      onChange={(e) =>
                        updateFormData("tax", "tin", e.target.value)
                      }
                      value={formData.tax.tin}
                    />
                  ) : (
                    <p className="font-mono text-foreground">
                      {formData.tax.tin}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nis">National Insurance Scheme (NIS)</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="nis-help"
                      id="nis"
                      onChange={(e) =>
                        updateFormData("tax", "nis", e.target.value)
                      }
                      value={formData.tax.nis}
                    />
                  ) : (
                    <p className="font-mono text-foreground">
                      {formData.tax.nis}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>VAT Registration Status</Label>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        formData.tax.vatRegistered ? "default" : "secondary"
                      }
                    >
                      {formData.tax.vatRegistered
                        ? "VAT Registered"
                        : "Not VAT Registered"}
                    </Badge>
                  </div>
                </div>

                {formData.tax.vatRegistered && (
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    {isEditing ? (
                      <Input
                        aria-describedby="vat-help"
                        id="vatNumber"
                        onChange={(e) =>
                          updateFormData("tax", "vatNumber", e.target.value)
                        }
                        value={formData.tax.vatNumber}
                      />
                    ) : (
                      <p className="font-mono text-foreground">
                        {formData.tax.vatNumber}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="payeNumber">PAYE Number</Label>
                  {isEditing ? (
                    <Input
                      aria-describedby="paye-help"
                      id="payeNumber"
                      onChange={(e) =>
                        updateFormData("tax", "payeNumber", e.target.value)
                      }
                      value={formData.tax.payeNumber}
                    />
                  ) : (
                    <p className="font-mono text-foreground">
                      {formData.tax.payeNumber}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield aria-hidden="true" className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex items-center space-x-2">
                    <Badge className="px-3 py-1 text-base" variant="outline">
                      {formData.account.accountType}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        formData.account.status === "Active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {formData.account.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <p className="text-foreground">
                    {new Date(formData.account.memberSince).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Last Login</Label>
                  <p className="text-foreground">
                    {new Date(formData.account.lastLogin).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useAuth, type User } from "@/lib/auth"
// import { MapPin, Search, Phone, Star, Clock, UserIcon } from "lucide-react"
// import { Badge } from "@/components/ui/badge"

// interface ServiceRequest {
//   id: string
//   userId: string
//   serviceType: "plumber" | "electrician" | "carpenter"
//   location: {
//     lat: number
//     lng: number
//     address: stringnpm ru
//   }
//   description: string
//   status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled"
//   providerId?: string
//   createdAt: string
// }

// export default function UserDashboard() {
//   const { user, logout } = useAuth()
//   const [location, setLocation] = useState("")
//   const [serviceType, setServiceType] = useState<"plumber" | "electrician" | "carpenter" | "">("")
//   const [description, setDescription] = useState("")
//   const [nearbyProviders, setNearbyProviders] = useState<User[]>([])
//   const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null)
//   const [loading, setLoading] = useState(false)

//   const getCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords
//           // In a real app, you'd reverse geocode this to get the address
//           setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
//         },
//         (error) => {
//           console.error("Error getting location:", error)
//           alert("Unable to get your location. Please enter it manually.")
//         },
//       )
//     }
//   }

//   const searchProviders = () => {
//     if (!location || !serviceType) {
//       alert("Please enter location and select service type")
//       return
//     }

//     setLoading(true)

//     // Simulate API call to find nearby providers
//     setTimeout(() => {
//       const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
//       const providers = allUsers.filter(
//         (u: User) => u.role === "service_provider" && u.serviceType === serviceType && u.isAvailable,
//       )

//       setNearbyProviders(providers)
//       setLoading(false)
//     }, 1000)
//   }

//   const requestService = (providerId: string) => {
//     const newRequest: ServiceRequest = {
//       id: Date.now().toString(),
//       userId: user!.id,
//       serviceType: serviceType as "plumber" | "electrician" | "carpenter",
//       location: {
//         lat: 0, // In real app, parse from location
//         lng: 0,
//         address: location,
//       },
//       description,
//       status: "pending",
//       providerId,
//       createdAt: new Date().toISOString(),
//     }

//     // Save request
//     const requests = JSON.parse(localStorage.getItem("requests") || "[]")
//     requests.push(newRequest)
//     localStorage.setItem("requests", JSON.stringify(requests))

//     setCurrentRequest(newRequest)
//     alert("Service request sent! The provider will be notified.")
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "pending":
//         return "bg-yellow-100 text-yellow-800"
//       case "accepted":
//         return "bg-blue-100 text-blue-800"
//       case "in_progress":
//         return "bg-purple-100 text-purple-800"
//       case "completed":
//         return "bg-green-100 text-green-800"
//       case "cancelled":
//         return "bg-red-100 text-red-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   if (!user) {
//     return <div>Please log in</div>
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
//             <p className="text-gray-600">Find the perfect service provider for your needs</p>
//           </div>
//           <Button variant="outline" onClick={logout}>
//             Logout
//           </Button>
//         </div>

//         {/* Current Request Status */}
//         {currentRequest && (
//           <Card className="mb-6 border-primary-200">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Clock className="h-5 w-5" />
//                 Current Request
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="font-medium capitalize">{currentRequest.serviceType} Service</p>
//                   <p className="text-sm text-gray-600">{currentRequest.location.address}</p>
//                   <p className="text-sm text-gray-600">{currentRequest.description}</p>
//                 </div>
//                 <Badge className={getStatusColor(currentRequest.status)}>
//                   {currentRequest.status.replace("_", " ").toUpperCase()}
//                 </Badge>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Service Request Form */}
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle>Request a Service</CardTitle>
//             <CardDescription>Tell us what you need and where you are</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="location">Your Location</Label>
//               <div className="flex gap-2">
//                 <div className="relative flex-1">
//                   <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                   <Input
//                     id="location"
//                     placeholder="Enter your address or coordinates"
//                     value={location}
//                     onChange={(e) => setLocation(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//                 <Button type="button" variant="outline" onClick={getCurrentLocation}>
//                   Use Current Location
//                 </Button>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Service Type</Label>
//               <Select
//                 value={serviceType}
//                 onValueChange={(value: "plumber" | "electrician" | "carpenter") => setServiceType(value)}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select service type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="plumber">Plumber</SelectItem>
//                   <SelectItem value="electrician">Electrician</SelectItem>
//                   <SelectItem value="carpenter">Carpenter</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="description">Description</Label>
//               <Input
//                 id="description"
//                 placeholder="Describe what you need help with..."
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//               />
//             </div>

//             <Button onClick={searchProviders} className="w-full bg-primary-600 hover:bg-primary-700" disabled={loading}>
//               <Search className="mr-2 h-4 w-4" />
//               {loading ? "Searching..." : "Find Service Providers"}
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Nearby Providers */}
//         {nearbyProviders.length > 0 && (
//           <Card>
//             <CardHeader>
//               <CardTitle>Available Service Providers</CardTitle>
//               <CardDescription>Choose from qualified professionals in your area</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {nearbyProviders.map((provider) => (
//                   <div key={provider.id} className="border rounded-lg p-4 hover:bg-gray-50">
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-start gap-3">
//                         <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
//                           <UserIcon className="h-6 w-6 text-primary-600" />
//                         </div>
//                         <div>
//                           <h3 className="font-medium text-gray-900">{provider.name}</h3>
//                           <p className="text-sm text-gray-600 capitalize">{provider.serviceType}</p>
//                           <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
//                           <div className="flex items-center gap-4 mt-2">
//                             <div className="flex items-center gap-1">
//                               <Star className="h-4 w-4 text-yellow-400 fill-current" />
//                               <span className="text-sm">{provider.rating}</span>
//                             </div>
//                             <span className="text-sm text-gray-600">{provider.completedJobs} jobs completed</span>
//                             <div className="flex items-center gap-1">
//                               <Phone className="h-4 w-4 text-gray-400" />
//                               <span className="text-sm">{provider.phone}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <Button
//                         onClick={() => requestService(provider.id)}
//                         className="bg-primary-600 hover:bg-primary-700"
//                         disabled={!!currentRequest}
//                       >
//                         Request Service
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   )
// }

// // app/staff/profile/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   User,
//   Mail,
//   Phone,
//   Briefcase,
//   Calendar,
//   Edit,
//   Save,
//   X,
//   CheckCircle,
//   AlertCircle,
// } from "lucide-react";
// import {
//   getMyProfile,
//   MyProfile,
//   updateMyProfile,
// } from "@/services/staffProfileApi";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export default function StaffProfilePage() {
//   const router = useRouter();
//   const [profile, setProfile] = useState<MyProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone_number: "",
//     specialty: "",
//   });

//   async function load() {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await getMyProfile();
//       setProfile(data);
//       setFormData({
//         name: data.name || "",
//         email: data.email || "",
//         phone_number: data.phone_number || "",
//         specialty: data.specialty || "",
//       });
//     } catch {
//       setError(
//         "Couldn't load your profile. You may not be registered as staff.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     queueMicrotask(() => {
//       load();
//     });
//   }, []);

//   async function handleSave() {
//     setSaving(true);
//     setError(null);
//     try {
//       const updated = await updateMyProfile(formData);
//       setProfile(updated);
//       setEditing(false);
//     } catch {
//       setError("Failed to update profile.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   function handleCancel() {
//     if (profile) {
//       setFormData({
//         name: profile.name || "",
//         email: profile.email || "",
//         phone_number: profile.phone_number || "",
//         specialty: profile.specialty || "",
//       });
//     }
//     setEditing(false);
//     setError(null);
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-slate-400">Loading profile...</div>
//       </div>
//     );
//   }

//   if (error && !profile) {
//     return (
//       <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
//         {error}
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="p-8 text-slate-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
//         Profile not found.
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-3xl p-3 sm:p-4 md:p-5">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-white">My Profile</h1>
//           <p className="text-sm text-slate-400 mt-1">
//             View and manage your staff profile information
//           </p>
//         </div>
//         <div className="flex gap-2">
//           {!editing ? (
//             <Button
//               onClick={() => setEditing(true)}
//               className="bg-emerald-500 text-white hover:bg-emerald-600"
//             >
//               <Edit size={16} className="mr-2" />
//               Edit Profile
//             </Button>
//           ) : (
//             <>
//               <Button
//                 variant="outline"
//                 onClick={handleCancel}
//                 className="border-slate-700 text-slate-300 hover:bg-slate-800"
//               >
//                 <X size={16} className="mr-2" />
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSave}
//                 disabled={saving}
//                 className="bg-emerald-500 text-white hover:bg-emerald-600"
//               >
//                 <Save size={16} className="mr-2" />
//                 {saving ? "Saving..." : "Save Changes"}
//               </Button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Profile Card */}
//       <Card className="bg-slate-900 border-slate-800 overflow-hidden">
//         <CardHeader className="border-b border-slate-800">
//           <div className="flex items-center gap-4">
//             <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400">
//               {profile.name.charAt(0).toUpperCase()}
//             </div>
//             <div>
//               <CardTitle className="text-xl font-semibold text-white">
//                 {profile.name}
//               </CardTitle>
//               <div className="flex items-center gap-2 mt-1">
//                 <span
//                   className={`
//                     inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
//                     ${
//                       profile.is_available
//                         ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
//                         : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
//                     }
//                   `}
//                 >
//                   <span
//                     className={`h-1.5 w-1.5 rounded-full ${
//                       profile.is_available ? "bg-emerald-500" : "bg-slate-500"
//                     }`}
//                   />
//                   {profile.is_available ? "Available" : "Unavailable"}
//                 </span>
//                 <span className="text-xs text-slate-500">
//                   Staff ID: {profile.id.slice(0, 8)}...
//                 </span>
//               </div>
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="p-6">
//           {error && (
//             <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
//               <span className="text-sm text-red-400">{error}</span>
//             </div>
//           )}

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Name */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-1">
//                 Full Name
//               </label>
//               {!editing ? (
//                 <p className="text-sm text-white">{profile.name}</p>
//               ) : (
//                 <input
//                   value={formData.name}
//                   onChange={(e) =>
//                     setFormData({ ...formData, name: e.target.value })
//                   }
//                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 />
//               )}
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-1">
//                 Email Address
//               </label>
//               {!editing ? (
//                 <p className="text-sm text-white">{profile.email}</p>
//               ) : (
//                 <input
//                   value={formData.email}
//                   onChange={(e) =>
//                     setFormData({ ...formData, email: e.target.value })
//                   }
//                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 />
//               )}
//             </div>

//             {/* Phone Number */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-1">
//                 Phone Number
//               </label>
//               {!editing ? (
//                 <p className="text-sm text-white font-mono">
//                   {profile.phone_number}
//                 </p>
//               ) : (
//                 <input
//                   value={formData.phone_number}
//                   onChange={(e) =>
//                     setFormData({ ...formData, phone_number: e.target.value })
//                   }
//                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 />
//               )}
//             </div>

//             {/* Specialty */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-1">
//                 Specialty
//               </label>
//               {!editing ? (
//                 <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
//                   {profile.specialty}
//                 </span>
//               ) : (
//                 <input
//                   value={formData.specialty}
//                   onChange={(e) =>
//                     setFormData({ ...formData, specialty: e.target.value })
//                   }
//                   placeholder="e.g. support, sales, technical"
//                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 />
//               )}
//             </div>
//           </div>

//           {/* Stats Section */}
//           <div className="mt-6 pt-6 border-t border-slate-800">
//             <h3 className="text-sm font-medium text-slate-400 mb-3">Stats</h3>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="bg-slate-800/50 rounded-lg p-3">
//                 <p className="text-xs text-slate-500">Total Cases</p>
//                 <p className="text-lg font-bold text-white">0</p>
//               </div>
//               <div className="bg-slate-800/50 rounded-lg p-3">
//                 <p className="text-xs text-slate-500">Active Cases</p>
//                 <p className="text-lg font-bold text-emerald-400">0</p>
//               </div>
//               <div className="bg-slate-800/50 rounded-lg p-3">
//                 <p className="text-xs text-slate-500">Resolved</p>
//                 <p className="text-lg font-bold text-blue-400">0</p>
//               </div>
//               <div className="bg-slate-800/50 rounded-lg p-3">
//                 <p className="text-xs text-slate-500">Joined</p>
//                 <p className="text-sm font-bold text-white">
//                   {profile.created_at
//                     ? new Date(profile.created_at).toLocaleDateString()
//                     : "—"}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { UserProfile } from "@clerk/clerk-react";

export default function Profile() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
        <UserProfile 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "border-0 shadow-none"
            }
          }}
        />
      </div>
    </div>
  );
} 
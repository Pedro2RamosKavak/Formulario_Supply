"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../packages/ui";

type User = {
  email: string;
  role: string;
  isLoggedIn: boolean;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un usuario en localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("currentUser");
      }
    } else {
      // Si no hay usuario, redirigir a login
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <span className="font-bold text-xl cursor-pointer" onClick={() => router.push("/")}>
                KAVAK
              </span>
              <span className="ml-2 text-sm text-gray-500">Vehicle Inspection Review</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center">
              <div className="mr-4 text-sm text-gray-600">
                <span>Conectado como </span>
                <span className="font-semibold">{user.email}</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {user.role === "admin" ? "Administrador" : "Revisor"}
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
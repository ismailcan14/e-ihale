'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaUserTag, FaEdit } from 'react-icons/fa';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://127.0.0.1:8000/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data))
      .catch((err) => console.error('Kullanıcı bilgileri alınamadı:', err));

    fetch('http://127.0.0.1:8000/users/by-company', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error('Çalışanlar alınamadı:', err));
  }, []);

  const handleUpdateClick = (employee: any) => {
    if (!currentUser) return;

    const isAdmin = currentUser?.role?.name === 'admin';
    const isManager = currentUser?.role?.name === 'müdür';
    const isPersonel = currentUser?.role?.name === 'personel';
    const isSelf = currentUser.id === employee.id;
    const isTargetAdmin = employee?.role?.name === 'admin';

    console.log("currentUser", currentUser);
console.log("employee", employee);
    if (isAdmin) {
      router.push(`employees/update/${employee.id}`);
    } else if (isManager && !isTargetAdmin) {
      router.push(`employees/update/${employee.id}`);
    } else if (isPersonel && isSelf) {
      router.push(`employees/update/${employee.id}`);
    } else {
      alert('Bu kullanıcıyı güncelleme yetkiniz yok.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">Çalışanlarım</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FaUser /> {employee.name}
              </h2>
              <p className="text-gray-600 flex items-center gap-2">
                <FaEnvelope /> {employee.email}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <FaUserTag /> {employee?.role?.name || 'Rol yok'}
              </p>

              <button
                onClick={() => handleUpdateClick(employee)}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition"
              >
                <FaEdit /> Güncelle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

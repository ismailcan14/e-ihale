'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaUserTag, FaEdit } from 'react-icons/fa';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://127.0.0.1:8000/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data))
      .catch((err) => console.error('Kullanıcı bilgileri alınamadı:', err));

    fetch('http://127.0.0.1:8000/users/by-company', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error('Çalışanlar alınamadı:', err));
  }, []);

  const canUpdate = (employee: any) => {
    if (!currentUser) return false;
    const role = currentUser?.role?.name;
    const isAdmin = role === 'admin';
    const isManager = role === 'müdür';
    const isPersonel = role === 'personel';
    const isSelf = currentUser.id === employee.id;
    const isTargetAdmin = employee?.role?.name === 'admin';

    if (isAdmin) return true;
    if (isManager && !isTargetAdmin) return true;
    if (isPersonel && isSelf) return true;
    return false;
  };

  const handleUpdateClick = (employee: any) => {
    if (!currentUser) return;
    if (canUpdate(employee)) {
      router.push(`/supplier/employees/update/${employee.id}`); 
    } else {
      alert('Bu kullanıcıyı güncelleme yetkiniz yok.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">
          Çalışanlarım
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {employees.map((employee) => {
            const allowed = canUpdate(employee);

            const CardInner = (
              <div
                className={`bg-white p-6 rounded-xl shadow-md border border-gray-200 transition ${
                  allowed ? 'hover:shadow-lg cursor-pointer' : 'cursor-default'
                }`}
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
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleUpdateClick(employee);
                  }}
                  className={`mt-4 py-2 px-4 rounded-lg flex items-center gap-2 transition ${
                    allowed
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!allowed}
                  title={allowed ? '' : 'Bu kullanıcıyı güncelleme yetkiniz yok.'}
                >
                  <FaEdit /> Güncelle
                </button>
              </div>
            );

            return allowed ? (
              <Link
                key={employee.id}
                href={`/supplier/employees/update/${employee.id}`}
                scroll={false}
                className="w-full"
                aria-label={`${employee.name} güncelle`}
              >
                {CardInner}
              </Link>
            ) : (
              <div key={employee.id} className="w-full">
                {CardInner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

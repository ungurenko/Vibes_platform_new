import { useState, useEffect } from 'react';
import { fetchAllStudents, fetchAllInvites } from '../lib/supabase';
import { Student, InviteLink } from '../types';

export const useAdminData = (isAdmin: boolean) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
        loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
      setIsLoading(true);
      try {
          const [allStudents, allInvites] = await Promise.all([
              fetchAllStudents(),
              fetchAllInvites()
          ]);
          setStudents(allStudents as Student[]);
          setInvites(allInvites as InviteLink[]);
      } catch (e) {
          console.error("Failed to load admin data:", e);
      } finally {
          setIsLoading(false);
      }
  };

  return {
      students, setStudents,
      invites, setInvites,
      isLoading,
      refreshAdminData: loadAdminData
  };
};

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { Eye } from 'lucide-react';

export default function AthleteDocumentsView() {
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    // Due to RLS, this generic query safely returns ONLY the authenticated user's records.
    const fetchMyDocuments = async () => {
      const { data } = await supabase.from('documents').select('*');
      if (data) setDocuments(data);
    };
    fetchMyDocuments();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Documents</h2>
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Document Type</th>
              <th className="p-4">Upload Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No documents found.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">
                    {/* Render specific string property, NOT the whole object */}
                    {doc.document_type || 'Unknown Document'}
                  </td>
                  <td className="p-4 text-slate-500">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      doc.status?.toLowerCase() === 'verified' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
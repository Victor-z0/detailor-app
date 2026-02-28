"use client";
import { Drawer } from 'vaul';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NewAppointmentDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('appointments').insert([{
      user_id: user?.id,
      customer_name: formData.get('name'),
      vehicle_make_model: formData.get('vehicle'),
      vehicle_type: formData.get('type'),
      service_name: formData.get('service'),
      total_price: formData.get('price'),
      scheduled_time: new Date().toISOString(),
    }]);

    if (!error) {
      setIsOpen(false);
      window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-[#2563eb] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-3xl font-light z-50 transition-transform hover:scale-110">
          +
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-[85%] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none p-6">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl font-black mb-6 text-black">New Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" placeholder="Customer Name" required className="w-full p-4 bg-gray-50 rounded-xl outline-none text-black" />
              <input name="vehicle" placeholder="Vehicle (e.g. BMW M3)" required className="w-full p-4 bg-gray-50 rounded-xl outline-none text-black" />
              <select name="type" className="w-full p-4 bg-gray-50 rounded-xl outline-none text-black">
                <option>Sedan</option>
                <option>SUV</option>
                <option>Truck</option>
              </select>
              <input name="price" type="number" placeholder="Price ($)" required className="w-full p-4 bg-gray-50 rounded-xl outline-none text-black" />
              <input name="service" placeholder="Service Name" required className="w-full p-4 bg-gray-50 rounded-xl outline-none text-black" />
              <button type="submit" disabled={loading} className="w-full bg-[#2563eb] text-white py-4 rounded-xl font-bold">
                {loading ? 'Saving...' : 'Add Job'}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
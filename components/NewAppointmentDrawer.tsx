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
      customer_phone: formData.get('phone'), // Added for direct texting
      vehicle_make_model: formData.get('vehicle'),
      vehicle_type: formData.get('type'),
      service_name: formData.get('service'),
      total_price: formData.get('price'),
      status: formData.get('status'), // This powers the color coding
      scheduled_time: new Date().toISOString(),
    }]);

    if (!error) {
      setIsOpen(false);
      window.location.reload(); 
    } else {
      console.error(error);
      alert("Error saving: Make sure the 'appointments' table has these columns!");
    }
    setLoading(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-brand text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-3xl font-light z-50 transition-transform hover:scale-110">
          +
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-4xl h-[90%] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none p-6 text-black overflow-y-auto">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-gray-300 mb-8" />
          
          <div className="max-w-md mx-auto w-full pb-10">
            <h2 className="text-2xl font-black mb-1">New Job</h2>
            <p className="text-gray-400 text-sm mb-6 font-medium">Enter customer and vehicle details</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CUSTOMER INFO */}
              <div className="grid grid-cols-2 gap-3">
                <input name="name" placeholder="Name" required className="p-4 bg-gray-50 rounded-xl outline-none" />
                <input name="phone" placeholder="Phone" required className="p-4 bg-gray-50 rounded-xl outline-none" />
              </div>

              {/* VEHICLE INFO */}
              <input name="vehicle" placeholder="Vehicle (e.g. BMW M3)" required className="p-4 bg-gray-50 rounded-xl outline-none w-full" />
              
              <div className="grid grid-cols-2 gap-3">
                <select name="type" className="p-4 bg-gray-50 rounded-xl outline-none">
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Truck</option>
                  <option>Coupe</option>
                </select>
                <input name="price" type="number" placeholder="Price ($)" required className="p-4 bg-gray-50 rounded-xl outline-none" />
              </div>

              <input name="service" placeholder="Service (e.g. Interior Detail)" required className="p-4 bg-gray-50 rounded-xl outline-none w-full" />

              {/* STEP 2: STATUS SELECTOR */}
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Current Status</label>
                <select name="status" className="w-full p-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 font-bold">
                  <option value="Upcoming">Upcoming (Blue)</option>
                  <option value="In-Progress">In-Progress (Green)</option>
                  <option value="Completed">Completed (Gray)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-brand text-white py-4 rounded-xl font-black text-lg mt-4">
                {loading ? 'Creating Job...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
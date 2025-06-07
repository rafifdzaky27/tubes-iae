'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useServiceClient } from '@/lib/apollo-provider';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

// GraphQL queries and mutations
const GET_GUESTS = gql`
  query GetGuests {
    guests {
      id
      fullName
      email
      phone
      address
    }
  }
`;

const CREATE_GUEST = gql`
  mutation CreateGuest($guestData: GuestInput!) {
    createGuest(guestData: $guestData) {
      id
      fullName
      email
      phone
      address
    }
  }
`;

const UPDATE_GUEST = gql`
  mutation UpdateGuest($id: Int!, $guestData: GuestUpdateInput!) {
    updateGuest(id: $id, guestData: $guestData) {
      id
      fullName
      email
      phone
      address
    }
  }
`;

const DELETE_GUEST = gql`
  mutation DeleteGuest($id: Int!) {
    deleteGuest(id: $id)
  }
`;

// Guest type definition
type Guest = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

// Guest form data type
type GuestFormData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

export default function GuestsPage() {
  // Get the guest service client
  const guestClient = useServiceClient('guest');
  
  // State for guest management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGuest, setCurrentGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<GuestFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Fetch guests data
  const { loading, error, data, refetch } = useQuery(GET_GUESTS, {
    client: guestClient,
  });
  
  // Mutations
  const [createGuest] = useMutation(CREATE_GUEST, {
    client: guestClient,
    onCompleted: () => {
      toast.success('Guest created successfully');
      refetch();
      closeModal();
    },
    onError: (error) => {
      toast.error(`Error creating guest: ${error.message}`);
    }
  });
  
  const [updateGuest] = useMutation(UPDATE_GUEST, {
    client: guestClient,
    onCompleted: () => {
      toast.success('Guest updated successfully');
      refetch();
      closeModal();
    },
    onError: (error) => {
      toast.error(`Error updating guest: ${error.message}`);
    }
  });
  
  const [deleteGuest] = useMutation(DELETE_GUEST, {
    client: guestClient,
    onCompleted: () => {
      toast.success('Guest deleted successfully');
      refetch();
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Error deleting guest: ${error.message}`);
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Open modal for creating a new guest
  const openCreateModal = () => {
    setCurrentGuest(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsModalOpen(true);
  };
  
  // Open modal for editing a guest
  const openEditModal = (guest: Guest) => {
    setCurrentGuest(guest);
    setFormData({
      fullName: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address
    });
    setIsModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (guest: Guest) => {
    setCurrentGuest(guest);
    setIsDeleteModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentGuest) {
      // Update existing guest
      updateGuest({
        variables: {
          id: currentGuest.id,
          guestData: formData
        }
      });
    } else {
      // Create new guest
      createGuest({
        variables: {
          guestData: formData
        }
      });
    }
  };
  
  // Handle guest deletion
  const handleDeleteGuest = () => {
    if (currentGuest) {
      deleteGuest({
        variables: {
          id: currentGuest.id
        }
      });
    }
  };
  
  // Filter guests based on search term
  const filteredGuests = data?.guests.filter((guest: Guest) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      guest.fullName.toLowerCase().includes(searchTermLower) ||
      guest.email.toLowerCase().includes(searchTermLower) ||
      guest.phone.toLowerCase().includes(searchTermLower)
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Guest Management</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Guest
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search guests by name, email, phone or ID..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Guests table */}
      <div className="table-container">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-500">Loading guests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">Error loading guests: {error.message}</p>
          </div>
        ) : (
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Contact Information</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    No guests found. {searchTerm ? 'Try a different search term.' : 'Add a guest to get started.'}
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest: Guest) => (
                  <tr key={guest.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{guest.fullName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{guest.address}</div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        <span>{guest.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        <span>{guest.phone}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(guest)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(guest)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Guest form modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {currentGuest ? 'Edit Guest' : 'Add New Guest'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="fullName" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="form-label">Address</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                      >
                        {currentGuest ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* Delete confirmation modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Delete Guest
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete guest {currentGuest?.fullName}? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                      onClick={handleDeleteGuest}
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

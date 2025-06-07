'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useServiceClient } from '@/lib/apollo-provider';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

// GraphQL queries and mutations
const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
`;

const CREATE_ROOM = gql`
  mutation CreateRoom($roomData: RoomInput!) {
    createRoom(roomData: $roomData) {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
`;

const UPDATE_ROOM = gql`
  mutation UpdateRoom($id: Int!, $roomData: RoomUpdateInput!) {
    updateRoom(id: $id, roomData: $roomData) {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
`;

const DELETE_ROOM = gql`
  mutation DeleteRoom($id: Int!) {
    deleteRoom(id: $id)
  }
`;

// Room type definition
type Room = {
  id: number;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  status: string;
};

// Room form data type
type RoomFormData = {
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  status: string;
};

export default function RoomsPage() {
  // Get the room service client
  const roomClient = useServiceClient('room');
  
  // State for room management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: '',
    roomType: 'standard',
    pricePerNight: 0,
    status: 'available'
  });
  
  // Fetch rooms data
  const { loading, error, data, refetch } = useQuery(GET_ROOMS, {
    client: roomClient,
  });
  
  // Mutations
  const [createRoom] = useMutation(CREATE_ROOM, {
    client: roomClient,
    onCompleted: () => {
      toast.success('Room created successfully');
      refetch();
      closeModal();
    },
    onError: (error) => {
      toast.error(`Error creating room: ${error.message}`);
    }
  });
  
  const [updateRoom] = useMutation(UPDATE_ROOM, {
    client: roomClient,
    onCompleted: () => {
      toast.success('Room updated successfully');
      refetch();
      closeModal();
    },
    onError: (error) => {
      toast.error(`Error updating room: ${error.message}`);
    }
  });
  
  const [deleteRoom] = useMutation(DELETE_ROOM, {
    client: roomClient,
    onCompleted: () => {
      toast.success('Room deleted successfully');
      refetch();
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Error deleting room: ${error.message}`);
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'pricePerNight' ? parseFloat(value) : value
    });
  };
  
  // Open modal for creating a new room
  const openCreateModal = () => {
    setCurrentRoom(null);
    setFormData({
      roomNumber: '',
      roomType: 'standard',
      pricePerNight: 0,
      status: 'available'
    });
    setIsModalOpen(true);
  };
  
  // Open modal for editing a room
  const openEditModal = (room: Room) => {
    setCurrentRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      pricePerNight: room.pricePerNight,
      status: room.status
    });
    setIsModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (room: Room) => {
    setCurrentRoom(room);
    setIsDeleteModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentRoom) {
      // Update existing room
      updateRoom({
        variables: {
          id: currentRoom.id,
          roomData: formData
        }
      });
    } else {
      // Create new room
      createRoom({
        variables: {
          roomData: formData
        }
      });
    }
  };
  
  // Handle room deletion
  const handleDeleteRoom = () => {
    if (currentRoom) {
      deleteRoom({
        variables: {
          id: currentRoom.id
        }
      });
    }
  };
  
  // Filter rooms based on search term
  const filteredRooms = data?.rooms.filter((room: Room) => 
    room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.roomType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'badge-success';
      case 'occupied':
        return 'badge-danger';
      case 'reserved':
        return 'badge-warning';
      case 'maintenance':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Room
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
            placeholder="Search rooms by number, type or status..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Rooms table */}
      <div className="table-container">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-500">Loading rooms...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">Error loading rooms: {error.message}</p>
          </div>
        ) : (
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Room Number</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Price/Night</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No rooms found. {searchTerm ? 'Try a different search term.' : 'Add a room to get started.'}
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room: Room) => (
                  <tr key={room.id} className="table-row">
                    <td className="table-cell font-medium text-gray-900">{room.roomNumber}</td>
                    <td className="table-cell capitalize">{room.roomType}</td>
                    <td className="table-cell">${room.pricePerNight.toFixed(2)}</td>
                    <td className="table-cell">
                      <span className={`${getStatusBadge(room.status)} capitalize`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(room)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(room)}
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
      
      {/* Room form modal */}
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
                    {currentRoom ? 'Edit Room' : 'Add New Room'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="roomNumber" className="form-label">Room Number</label>
                      <input
                        type="text"
                        id="roomNumber"
                        name="roomNumber"
                        value={formData.roomNumber}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="roomType" className="form-label">Room Type</label>
                      <select
                        id="roomType"
                        name="roomType"
                        value={formData.roomType}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="standard">Standard</option>
                        <option value="deluxe">Deluxe</option>
                        <option value="suite">Suite</option>
                        <option value="executive">Executive</option>
                        <option value="presidential">Presidential</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="pricePerNight" className="form-label">Price per Night ($)</label>
                      <input
                        type="number"
                        id="pricePerNight"
                        name="pricePerNight"
                        value={formData.pricePerNight}
                        onChange={handleInputChange}
                        className="input-field"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="form-label">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
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
                        {currentRoom ? 'Update' : 'Create'}
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
                    Delete Room
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete room {currentRoom?.roomNumber}? This action cannot be undone.
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
                      onClick={handleDeleteRoom}
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

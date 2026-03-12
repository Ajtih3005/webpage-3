"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, RefreshCw, Users, Save, X, Music, Disc3, Settings, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface BandMember {
  id: number
  name: string
  role: string
  instrument: string
  image_url: string
  bio: string
  display_order: number
  is_active: boolean
  created_at: string
}

interface Album {
  id: number
  title: string
  year: string
  tracks: number
  image_url: string
  spotify_link: string
  youtube_link: string
  display_order: number
  is_active: boolean
  created_at: string
}

export default function SwarasyaManagementPage() {
  const [members, setMembers] = useState<BandMember[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Member dialogs
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false)
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<BandMember | null>(null)
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null)
  
  // Album dialogs
  const [showAddAlbumDialog, setShowAddAlbumDialog] = useState(false)
  const [showEditAlbumDialog, setShowEditAlbumDialog] = useState(false)
  const [showDeleteAlbumDialog, setShowDeleteAlbumDialog] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [deleteAlbumId, setDeleteAlbumId] = useState<number | null>(null)

  const [memberFormData, setMemberFormData] = useState({
    name: "",
    role: "",
    instrument: "",
    image_url: "",
    bio: "",
  })

  const [albumFormData, setAlbumFormData] = useState({
    title: "",
    year: "",
    tracks: 0,
    image_url: "",
    spotify_link: "",
    youtube_link: "",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from("swarasya_members")
        .select("*")
        .order("display_order", { ascending: true })

      if (membersError) {
        if (membersError.message.includes("does not exist")) {
          setError("Please run the swarasya_schema.sql script in your Supabase database first!")
          setLoading(false)
          return
        }
        throw membersError
      }
      setMembers(membersData || [])

      // Fetch albums
      const { data: albumsData, error: albumsError } = await supabase
        .from("swarasya_albums")
        .select("*")
        .order("display_order", { ascending: true })

      if (albumsError && !albumsError.message.includes("does not exist")) {
        throw albumsError
      }
      setAlbums(albumsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Member functions
  const resetMemberForm = () => {
    setMemberFormData({
      name: "",
      role: "",
      instrument: "",
      image_url: "",
      bio: "",
    })
  }

  const handleAddMember = () => {
    setShowAddMemberDialog(true)
    resetMemberForm()
  }

  const handleEditMember = (member: BandMember) => {
    setSelectedMember(member)
    setMemberFormData({
      name: member.name,
      role: member.role,
      instrument: member.instrument || "",
      image_url: member.image_url || "",
      bio: member.bio || "",
    })
    setShowEditMemberDialog(true)
  }

  const handleDeleteMember = (id: number) => {
    setDeleteMemberId(id)
    setShowDeleteMemberDialog(true)
  }

  const confirmDeleteMember = async () => {
    if (!deleteMemberId) return

    try {
      const { error } = await supabase.from("swarasya_members").delete().eq("id", deleteMemberId)

      if (error) throw error
      setSuccess("Member deleted successfully!")
      await fetchData()
      setShowDeleteMemberDialog(false)
      setDeleteMemberId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveMember = async () => {
    try {
      if (selectedMember) {
        // Edit existing member
        const { error } = await supabase
          .from("swarasya_members")
          .update({ ...memberFormData, updated_at: new Date().toISOString() })
          .eq("id", selectedMember.id)

        if (error) throw error
        setSuccess("Member updated successfully!")
        setShowEditMemberDialog(false)
      } else {
        // Add new member
        const maxOrder = members.length > 0 ? Math.max(...members.map((m) => m.display_order)) : 0
        const { error } = await supabase.from("swarasya_members").insert({
          ...memberFormData,
          display_order: maxOrder + 1,
          is_active: true,
        })

        if (error) throw error
        setSuccess("Member added successfully!")
        setShowAddMemberDialog(false)
      }

      await fetchData()
      resetMemberForm()
      setSelectedMember(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Album functions
  const resetAlbumForm = () => {
    setAlbumFormData({
      title: "",
      year: "",
      tracks: 0,
      image_url: "",
      spotify_link: "",
      youtube_link: "",
    })
  }

  const handleAddAlbum = () => {
    setShowAddAlbumDialog(true)
    resetAlbumForm()
  }

  const handleEditAlbum = (album: Album) => {
    setSelectedAlbum(album)
    setAlbumFormData({
      title: album.title,
      year: album.year || "",
      tracks: album.tracks || 0,
      image_url: album.image_url || "",
      spotify_link: album.spotify_link || "",
      youtube_link: album.youtube_link || "",
    })
    setShowEditAlbumDialog(true)
  }

  const handleDeleteAlbum = (id: number) => {
    setDeleteAlbumId(id)
    setShowDeleteAlbumDialog(true)
  }

  const confirmDeleteAlbum = async () => {
    if (!deleteAlbumId) return

    try {
      const { error } = await supabase.from("swarasya_albums").delete().eq("id", deleteAlbumId)

      if (error) throw error
      setSuccess("Album deleted successfully!")
      await fetchData()
      setShowDeleteAlbumDialog(false)
      setDeleteAlbumId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveAlbum = async () => {
    try {
      if (selectedAlbum) {
        // Edit existing album
        const { error } = await supabase
          .from("swarasya_albums")
          .update({ ...albumFormData, updated_at: new Date().toISOString() })
          .eq("id", selectedAlbum.id)

        if (error) throw error
        setSuccess("Album updated successfully!")
        setShowEditAlbumDialog(false)
      } else {
        // Add new album
        const maxOrder = albums.length > 0 ? Math.max(...albums.map((a) => a.display_order)) : 0
        const { error } = await supabase.from("swarasya_albums").insert({
          ...albumFormData,
          display_order: maxOrder + 1,
          is_active: true,
        })

        if (error) throw error
        setSuccess("Album added successfully!")
        setShowAddAlbumDialog(false)
      }

      await fetchData()
      resetAlbumForm()
      setSelectedAlbum(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const activeMembers = members.filter((m) => m.is_active)
  const activeAlbums = albums.filter((a) => a.is_active)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Swarasya Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your band members and albums</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/swarasya" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Page
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 flex justify-between items-center">
              <p className="text-green-600">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-amber-700">{members.length}</p>
                  <p className="text-amber-600">Band Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Disc3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-purple-700">{albums.length}</p>
                  <p className="text-purple-600">Albums</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Music className="h-8 w-8 text-teal-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-teal-700">
                    {albums.reduce((sum, album) => sum + (album.tracks || 0), 0)}
                  </p>
                  <p className="text-teal-600">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Members and Albums */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Band Members
            </TabsTrigger>
            <TabsTrigger value="albums" className="flex items-center gap-2">
              <Disc3 className="h-4 w-4" />
              Albums
            </TabsTrigger>
          </TabsList>

          {/* Band Members Tab */}
          <TabsContent value="members">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-amber-800">Band Members</CardTitle>
                  <CardDescription>Manage your Swarasya band members</CardDescription>
                </div>
                <Button
                  onClick={handleAddMember}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <Users className="h-12 w-12 mb-2 text-gray-300" />
                    <p>No band members yet. Add your first member!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Photo</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-200 bg-gray-100">
                                {member.image_url ? (
                                  <Image
                                    src={member.image_url}
                                    alt={member.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Users className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                                {member.role}
                              </span>
                            </TableCell>
                            <TableCell>{member.instrument}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditMember(member)}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="hover:bg-red-50 hover:border-red-300 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Drive Instructions */}
            <Card className="mt-4 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 text-lg">How to Add Images from Google Drive</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700 text-sm space-y-2">
                <p>1. Upload your image to Google Drive</p>
                <p>2. Right-click on the image and select &quot;Get link&quot;</p>
                <p>3. Make sure it&apos;s set to &quot;Anyone with the link can view&quot;</p>
                <p>4. Copy the file ID from the URL (the long string between /d/ and /view)</p>
                <p>5. Use this format for the Image URL:</p>
                <code className="block bg-blue-100 p-2 rounded mt-2">
                  https://drive.google.com/uc?export=view&id=YOUR_FILE_ID
                </code>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-purple-800">Albums</CardTitle>
                  <CardDescription>Manage your Swarasya albums and discography</CardDescription>
                </div>
                <Button
                  onClick={handleAddAlbum}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Album
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : albums.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <Disc3 className="h-12 w-12 mb-2 text-gray-300" />
                    <p>No albums yet. Add your first album!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Cover</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Tracks</TableHead>
                          <TableHead>Links</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {albums.map((album) => (
                          <TableRow key={album.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="w-12 h-12 rounded overflow-hidden border-2 border-purple-200 bg-gray-100">
                                {album.image_url ? (
                                  <Image
                                    src={album.image_url}
                                    alt={album.title}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Disc3 className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{album.title}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                {album.year}
                              </span>
                            </TableCell>
                            <TableCell>{album.tracks} tracks</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {album.spotify_link && (
                                  <Link href={album.spotify_link} target="_blank" className="text-green-600 hover:text-green-800">
                                    <Music className="h-4 w-4" />
                                  </Link>
                                )}
                                {album.youtube_link && (
                                  <Link href={album.youtube_link} target="_blank" className="text-red-600 hover:text-red-800">
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditAlbum(album)}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAlbum(album.id)}
                                  className="hover:bg-red-50 hover:border-red-300 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Member Dialog */}
      <Dialog
        open={showAddMemberDialog || showEditMemberDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddMemberDialog(false)
            setShowEditMemberDialog(false)
            resetMemberForm()
            setSelectedMember(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-800">
              {selectedMember ? "Edit Band Member" : "Add New Band Member"}
            </DialogTitle>
            <DialogDescription>
              {selectedMember ? "Update the band member information" : "Add a new musician to Swarasya"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <Input
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role *</label>
                <Input
                  value={memberFormData.role}
                  onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                  placeholder="e.g., Lead Vocalist, Percussionist"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Instrument</label>
                <Input
                  value={memberFormData.instrument}
                  onChange={(e) => setMemberFormData({ ...memberFormData, instrument: e.target.value })}
                  placeholder="e.g., Vocals & Harmonium"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Image URL (Google Drive)</label>
                <Input
                  value={memberFormData.image_url}
                  onChange={(e) => setMemberFormData({ ...memberFormData, image_url: e.target.value })}
                  placeholder="https://drive.google.com/uc?export=view&id=..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <Textarea
                  value={memberFormData.bio}
                  onChange={(e) => setMemberFormData({ ...memberFormData, bio: e.target.value })}
                  placeholder="Brief description about the musician"
                  rows={8}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberDialog(false)
                setShowEditMemberDialog(false)
                resetMemberForm()
                setSelectedMember(null)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveMember} 
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!memberFormData.name || !memberFormData.role}
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedMember ? "Update" : "Add"} Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Album Dialog */}
      <Dialog
        open={showAddAlbumDialog || showEditAlbumDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddAlbumDialog(false)
            setShowEditAlbumDialog(false)
            resetAlbumForm()
            setSelectedAlbum(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-purple-800">
              {selectedAlbum ? "Edit Album" : "Add New Album"}
            </DialogTitle>
            <DialogDescription>
              {selectedAlbum ? "Update the album information" : "Add a new album to your discography"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title *</label>
                <Input
                  value={albumFormData.title}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, title: e.target.value })}
                  placeholder="Album title"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Year</label>
                <Input
                  value={albumFormData.year}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, year: e.target.value })}
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Number of Tracks</label>
                <Input
                  type="number"
                  value={albumFormData.tracks}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, tracks: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Cover Image URL</label>
                <Input
                  value={albumFormData.image_url}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, image_url: e.target.value })}
                  placeholder="https://drive.google.com/uc?export=view&id=..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Spotify Link</label>
                <Input
                  value={albumFormData.spotify_link}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, spotify_link: e.target.value })}
                  placeholder="https://open.spotify.com/album/..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">YouTube Link</label>
                <Input
                  value={albumFormData.youtube_link}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, youtube_link: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddAlbumDialog(false)
                setShowEditAlbumDialog(false)
                resetAlbumForm()
                setSelectedAlbum(null)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAlbum} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!albumFormData.title}
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedAlbum ? "Update" : "Add"} Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <AlertDialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the band member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMember} className="bg-red-600 hover:bg-red-700">
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Album Confirmation Dialog */}
      <AlertDialog open={showDeleteAlbumDialog} onOpenChange={setShowDeleteAlbumDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAlbum} className="bg-red-600 hover:bg-red-700">
              Delete Album
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

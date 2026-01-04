import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Code,
    Heart,
    Laptop,
    Mail,
    Palette,
    Rocket,
    Zap
} from 'lucide-react';

export default function DevPage() {
    const techStack = [
        { name: 'Laravel', color: 'bg-red-100 text-red-800 border-red-200' },
        { name: 'React', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { name: 'TypeScript', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { name: 'Inertia.js', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { name: 'Tailwind CSS', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
        { name: 'MySQL', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        { name: 'Vite', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    ];

    const teamMembers = [
        {
            name: 'Alif Fadillah',
            role: 'Lead Developer',
            description: 'Full Stack Developer yang fokus menyuruh AI untuk membuat frontnd dan backend aplikasi',
            photo: '/team/foto-kucing-oren.jpg', // Foto akan disimpan di public/team/
            gradient: 'from-indigo-500 to-purple-600',
            contact: '2210631170004@student.unsika.ac.id'
        },
        {
            name: 'Teman Developer', // Silakan ganti dengan nama asli
            role: 'Co-Developer',
            description: 'Developer yang membantu dalam pengembangan fitur dan testing aplikasi',
            photo: '/team/co-developer.jpg', // Foto akan disimpan di public/team/
            gradient: 'from-green-500 to-teal-600',
            contact: 'partner@example.com' // Silakan ganti dengan email asli
        },
        {
            name: 'Dosen Pembimbing', // Silakan ganti dengan nama asli
            role: 'Project Supervisor',
            description: 'Dosen pembimbing yang memberikan arahan dan supervisi dalam pengembangan sistem',
            photo: '/team/supervisor.jpg', // Foto akan disimpan di public/team/
            gradient: 'from-orange-500 to-red-600',
            contact: 'supervisor@unsika.ac.id' // Silakan ganti dengan email asli
        }
    ];

    const features = [
        'Sistem Tes Online yang Komprehensif',
        'User Management dengan Role-based Access',
        'Real-time Test Timer & Auto-submit',
        'Responsive Design untuk Semua Device',
        'Dashboard Analytics & Reporting',
        'Secure Authentication & Authorization',
    ];

    return (
        <>
            <Head title="Developer Info" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="container mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <Code className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Development Team
                            </h1>
                        </div>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Meet the amazing team behind this Test Online System for Universitas Singaperbangsa Karawang
                        </p>
                    </div>

                    {/* Team Members */}
                    <div className="grid gap-6 md:grid-cols-3 mb-12">
                        {teamMembers.map((member, index) => {
                            const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();

                            return (
                                <Card key={index} className="h-full">
                                    <CardHeader className="text-center">
                                        <div className="mx-auto mb-4 h-20 w-20 rounded-full overflow-hidden ring-4 ring-white shadow-lg relative">
                                            {/* Avatar default dengan initial */}
                                            <div className={`h-full w-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-bold text-xl`}>
                                                {initials}
                                            </div>
                                            {/* Foto yang akan menimpa avatar jika ada */}
                                            <img
                                                src={member.photo}
                                                alt={member.name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <CardTitle className="text-xl">{member.name}</CardTitle>
                                        <CardDescription className="text-base font-medium text-indigo-600">
                                            {member.role}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground text-center">
                                            {member.description}
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a
                                                href={`mailto:${member.contact}`}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
                                            >
                                                {member.contact}
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid gap-8 lg:grid-cols-2">

                        {/* Project Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Rocket className="h-5 w-5" />
                                    Project: Tes Online UNSIKA
                                </CardTitle>
                                <CardDescription>
                                    Comprehensive online testing system built specifically for Universitas Singaperbangsa Karawang
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <Zap className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tech Stack */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Laptop className="h-5 w-5" />
                                    Technology Stack
                                </CardTitle>
                                <CardDescription>
                                    Modern technologies used to build this application
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {techStack.map((tech, index) => (
                                        <Badge key={index} variant="outline" className={tech.color}>
                                            {tech.name}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Development Stats */}
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Development Journey
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-indigo-600 mb-1">15+</div>
                                    <div className="text-sm text-muted-foreground">Components Built</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-1">50+</div>
                                    <div className="text-sm text-muted-foreground">Hours of Developing</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-pink-600 mb-1">3</div>
                                    <div className="text-sm text-muted-foreground">Team Members</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-orange-600 mb-1">∞</div>
                                    <div className="text-sm text-muted-foreground">Cups of Coffee</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Heart className="h-5 w-5 text-pink-200" />
                                    <span className="text-lg font-medium">Built with teamwork & passion</span>
                                    <Heart className="h-5 w-5 text-pink-200" />
                                </div>
                                <p className="text-indigo-100 mb-4">
                                    This project was crafted with dedication by our amazing team to provide the best online testing experience
                                    for students and educators at UNSIKA. Collaboration makes everything possible!
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    {/* <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Visit Portfolio
                                    </Button>
                                    <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                        <Github className="h-4 w-4 mr-2" />
                                        View on GitHub
                                    </Button> */}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Back to App */}
                    <div className="mt-8 text-center">
                        <Button asChild size="lg">
                            <a href="/">
                                <Rocket className="h-4 w-4 mr-2" />
                                Back to Application
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

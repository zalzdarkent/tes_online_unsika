<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PesertaRegisteredEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $jadwalId;
    public $registration;

    /**
     * Create a new event instance.
     */
    public function __construct($jadwalId, $registration)
    {
        $this->jadwalId = $jadwalId;
        $this->registration = $registration;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('jadwal.' . $this->jadwalId . '.peserta'),
            new Channel('peserta.' . $this->registration->id_peserta . '.registrations'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'peserta.registered';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'registration' => $this->registration,
        ];
    }
}

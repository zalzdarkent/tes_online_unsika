<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContinueTestAllowedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $pesertaId;
    public $jadwalId;
    public $registration;

    /**
     * Create a new event instance.
     */
    public function __construct($pesertaId, $jadwalId, $registration)
    {
        $this->pesertaId = $pesertaId;
        $this->jadwalId = $jadwalId;
        $this->registration = $registration;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('peserta.' . $this->pesertaId . '.test'),
            new Channel('jadwal.' . $this->jadwalId . '.peserta'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'test.continue.allowed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'jadwal_id' => $this->jadwalId,
            'registration' => $this->registration,
        ];
    }
}

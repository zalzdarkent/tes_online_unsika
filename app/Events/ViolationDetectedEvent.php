<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ViolationDetectedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $jadwalId;
    public $pesertaId;
    public $violation;

    /**
     * Create a new event instance.
     */
    public function __construct($jadwalId, $pesertaId, $violation)
    {
        $this->jadwalId = $jadwalId;
        $this->pesertaId = $pesertaId;
        $this->violation = $violation;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('jadwal.' . $this->jadwalId . '.violations'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'violation.detected';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'peserta_id' => $this->pesertaId,
            'violation' => $this->violation,
        ];
    }
}

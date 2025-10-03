<?php

namespace App\Http\Controllers;

use App\Models\ScreenshotViolation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ViolationController extends Controller
{
    /**
     * Report a screenshot violation
     */
    public function reportViolation(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'jadwal_id' => 'required|integer|exists:jadwal,id',
                'violation_type' => 'required|string|max:100',
                'detection_method' => 'required|string|max:100',
                'browser_info' => 'required|array',
                'violation_time' => 'required|string',
            ]);

            $violation = ScreenshotViolation::create([
                'jadwal_id' => $validated['jadwal_id'],
                'peserta_id' => Auth::id(),
                'violation_type' => $validated['violation_type'],
                'detection_method' => $validated['detection_method'],
                'browser_info' => $validated['browser_info'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'violation_time' => now()->parse($validated['violation_time']),
            ]);

            Log::warning('Screenshot violation detected', [
                'violation_id' => $violation->id,
                'user_id' => Auth::id(),
                'jadwal_id' => $validated['jadwal_id'],
                'violation_type' => $validated['violation_type'],
                'detection_method' => $validated['detection_method'],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Violation reported successfully',
                'violation_id' => $violation->id
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to report violation', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to report violation'
            ], 500);
        }
    }

    /**
     * Get violations for a specific jadwal (admin only)
     */
    public function getJadwalViolations(Request $request, int $jadwalId): JsonResponse
    {
        try {
            // Check if user has permission to view violations
            // You can add your authorization logic here

            $violations = ScreenshotViolation::where('jadwal_id', $jadwalId)
                ->with(['peserta:id,name,email', 'jadwal:id,nama'])
                ->orderBy('violation_time', 'desc')
                ->get()
                ->map(function ($violation) {
                    return [
                        'id' => $violation->id,
                        'peserta_id' => $violation->peserta_id,
                        'peserta_name' => $violation->peserta->name,
                        'peserta_email' => $violation->peserta->email,
                        'violation_type' => $violation->violation_type,
                        'detection_method' => $violation->detection_method,
                        'violation_time' => $violation->violation_time->format('Y-m-d H:i:s'),
                        'ip_address' => $violation->ip_address,
                        'browser_info' => $violation->browser_info,
                    ];
                });

            $summary = ScreenshotViolation::getJadwalViolations($jadwalId);

            return response()->json([
                'success' => true,
                'violations' => $violations,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get jadwal violations', [
                'error' => $e->getMessage(),
                'jadwal_id' => $jadwalId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get violations'
            ], 500);
        }
    }

    /**
     * Get violation summary for dashboard
     */
    public function getViolationSummary(Request $request): JsonResponse
    {
        try {
            $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));

            $summary = ScreenshotViolation::getViolationSummary($startDate, $endDate);

            return response()->json([
                'success' => true,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get violation summary', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get violation summary'
            ], 500);
        }
    }
}

export declare class HealthController {
    checkHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    root(): {
        name: string;
        status: string;
        timestamp: string;
    };
}

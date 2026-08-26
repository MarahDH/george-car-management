<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;

class BackupCommand extends Command
{
    protected $signature = 'warsha:backup';

    protected $description = 'Create a portable SQL backup of the database';

    public function handle(BackupService $backup): int
    {
        $file = $backup->create();
        $this->info("Backup created: {$file}");

        return self::SUCCESS;
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class BackupService
{
    /**
     * Create a portable SQL dump of the database using PDO only (no mysqldump
     * dependency — important for restricted hosting). Returns the file name.
     */
    public function create(int $keep = 14): string
    {
        $conn = DB::connection();
        $pdo = $conn->getPdo();
        $database = $conn->getDatabaseName();
        $key = 'Tables_in_' . $database;

        $sql = "-- Warsha backup of `{$database}` — " . now()->toDateTimeString() . "\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";

        foreach ($conn->select('SHOW TABLES') as $tableRow) {
            $table = $tableRow->{$key};

            $create = $conn->select("SHOW CREATE TABLE `{$table}`")[0];
            $sql .= "\nDROP TABLE IF EXISTS `{$table}`;\n" . $create->{'Create Table'} . ";\n";

            foreach ($conn->select("SELECT * FROM `{$table}`") as $row) {
                $data = (array) $row;
                $columns = '`' . implode('`,`', array_keys($data)) . '`';
                $values = implode(',', array_map(
                    fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v),
                    array_values($data),
                ));
                $sql .= "INSERT INTO `{$table}` ({$columns}) VALUES ({$values});\n";
            }
        }

        $sql .= "\nSET FOREIGN_KEY_CHECKS=1;\n";

        $dir = storage_path('app/backups');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $file = 'warsha-' . now()->format('Ymd-His') . '.sql';
        file_put_contents($dir . DIRECTORY_SEPARATOR . $file, $sql);

        $this->prune($dir, $keep);

        return $file;
    }

    private function prune(string $dir, int $keep): void
    {
        $files = glob($dir . DIRECTORY_SEPARATOR . 'warsha-*.sql') ?: [];
        usort($files, fn ($a, $b) => filemtime($b) <=> filemtime($a));
        foreach (array_slice($files, $keep) as $old) {
            @unlink($old);
        }
    }
}

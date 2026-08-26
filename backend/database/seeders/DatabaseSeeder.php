<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use App\Services\DocumentNumber;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Admin ----
        User::updateOrCreate(
            ['email' => 'admin@warsha.test'],
            [
                'name' => 'مدير الورشة',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ],
        );

        // ---- Settings ----
        $settings = [
            'business_name' => 'مركز النخبة لصيانة السيارات',
            'currency' => 'SYP',
            'currency_symbol' => 'ل.س',
            'locale' => 'ar',
            'invoice_number_format' => '{year}-{month}-{seq}',
            'invoice_seq_padding' => '4',
        ];
        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        // ---- Suppliers ----
        $suppliers = [];
        foreach ([
            ['name' => 'محل قطع الأصيل', 'phone' => '0944100200'],
            ['name' => 'تجارة النور لقطع الغيار', 'phone' => '0933220110'],
            ['name' => 'مؤسسة الشرق للإطارات', 'phone' => '0955330220'],
            ['name' => 'سوق الحرية للسيارات', 'phone' => '0988440330'],
        ] as $s) {
            $suppliers[] = Supplier::create($s);
        }

        // ---- Customers + cars ----
        $data = [
            ['name' => 'محمد العلي', 'phone' => '0955123456', 'email' => 'm.ali@example.com', 'address' => 'دمشق - المزة', 'cars' => [
                ['plate_number' => 'دمشق 123456', 'type' => 'تويوتا', 'model' => 'كامري', 'year' => 2018, 'chassis_number' => 'JT2BF22K1W0123456'],
                ['plate_number' => 'دمشق 771020', 'type' => 'هيونداي', 'model' => 'النترا', 'year' => 2020, 'chassis_number' => 'KMHD84LF5LU998877'],
            ]],
            ['name' => 'مرح ضاهر', 'phone' => '0991615451', 'email' => 'marah.d@example.com', 'address' => 'حمص - الإنشاءات', 'cars' => [
                ['plate_number' => 'حمص 445533', 'type' => 'كيا', 'model' => 'سبورتاج', 'year' => 2019],
            ]],
            ['name' => 'أحمد الخطيب', 'phone' => '0944778812', 'address' => 'حلب - الفرقان', 'cars' => [
                ['plate_number' => 'حلب 220044', 'type' => 'مرسيدس', 'model' => 'C200', 'year' => 2015],
            ]],
            ['name' => 'سامر حداد', 'phone' => '0937665544', 'email' => 'samer.h@example.com', 'address' => 'اللاذقية - الصليبة', 'cars' => [
                ['plate_number' => 'اللاذقية 100200', 'type' => 'نيسان', 'model' => 'صني', 'year' => 2017],
            ]],
            ['name' => 'ريم قاسم', 'phone' => '0966554433', 'address' => 'طرطوس', 'cars' => [
                ['plate_number' => 'طرطوس 330055', 'type' => 'كيا', 'model' => 'ريو', 'year' => 2021],
            ]],
            ['name' => 'خالد إبراهيم', 'phone' => '0912345678', 'email' => 'khaled.i@example.com', 'address' => 'دمشق - ركن الدين', 'cars' => [
                ['plate_number' => 'دمشق 998877', 'type' => 'بي إم دبليو', 'model' => '320i', 'year' => 2016],
            ]],
            ['name' => 'لينا سعيد', 'phone' => '0999112233', 'address' => 'دمشق - كفرسوسة', 'cars' => [
                ['plate_number' => 'دمشق 556677', 'type' => 'تويوتا', 'model' => 'كورولا', 'year' => 2022],
            ]],
            ['name' => 'عمر ناصر', 'phone' => '0955880077', 'email' => 'omar.n@example.com', 'address' => 'ريف دمشق - جرمانا', 'cars' => [
                ['plate_number' => 'ريف دمشق 214578', 'type' => 'هوندا', 'model' => 'سيفيك', 'year' => 2019],
                ['plate_number' => 'ريف دمشق 336699', 'type' => 'سوزوكي', 'model' => 'سويفت', 'year' => 2020],
            ]],
            ['name' => 'ياسمين حلبي', 'phone' => '0933445566', 'address' => 'حماة - العليليات', 'cars' => [
                ['plate_number' => 'حماة 120340', 'type' => 'رينو', 'model' => 'ميغان', 'year' => 2018],
            ]],
            ['name' => 'طارق منصور', 'phone' => '0944223311', 'email' => 'tarek.m@example.com', 'address' => 'درعا - البلد', 'cars' => [
                ['plate_number' => 'درعا 445566', 'type' => 'فورد', 'model' => 'فوكس', 'year' => 2017],
            ]],
            ['name' => 'نور الدين شيخ', 'phone' => '0988771122', 'address' => 'الحسكة', 'cars' => [
                ['plate_number' => 'الحسكة 778899', 'type' => 'ميتسوبيشي', 'model' => 'لانسر', 'year' => 2016],
            ]],
            ['name' => 'رامي العبدالله', 'phone' => '0966332211', 'address' => 'دير الزور', 'cars' => [
                ['plate_number' => 'دير الزور 553311', 'type' => 'شيفروليه', 'model' => 'أوبترا', 'year' => 2014],
            ]],
            ['name' => 'هالة يوسف', 'phone' => '0937112244', 'email' => 'hala.y@example.com', 'address' => 'السويداء', 'cars' => [
                ['plate_number' => 'السويداء 220033', 'type' => 'بيجو', 'model' => '301', 'year' => 2019],
                ['plate_number' => 'السويداء 660099', 'type' => 'تويوتا', 'model' => 'يارس', 'year' => 2021],
            ]],
            ['name' => 'فادي سلوم', 'phone' => '0999443322', 'address' => 'إدلب', 'cars' => [
                ['plate_number' => 'إدلب 101202', 'type' => 'سكودا', 'model' => 'أوكتافيا', 'year' => 2020],
            ]],
            ['name' => 'ديمة الحسن', 'phone' => '0955001199', 'address' => 'الرقة', 'cars' => [
                ['plate_number' => 'الرقة 303044', 'type' => 'كيا', 'model' => 'سيراتو', 'year' => 2021],
            ]],
            ['name' => 'بشار الأحمد', 'phone' => '0912009988', 'email' => 'bashar.a@example.com', 'address' => 'القنيطرة', 'cars' => [
                ['plate_number' => 'القنيطرة 505060', 'type' => 'هيونداي', 'model' => 'سوناتا', 'year' => 2018],
                ['plate_number' => 'القنيطرة 707080', 'type' => 'نيسان', 'model' => 'قشقاي', 'year' => 2022],
            ]],
        ];

        $customers = [];
        foreach ($data as $row) {
            $cars = $row['cars'];
            unset($row['cars']);
            $customer = Customer::create($row + ['country_code' => '963']);
            foreach ($cars as $car) {
                $customer->cars()->create($car);
            }
            $customers[] = $customer->load('cars');
        }

        // ---- Invoices (labor + parts, auto totals) ----
        $mk = function (Customer $c, string $date, string $status, array $labor, array $parts, float $paid, ?string $method) {
            $invoice = Invoice::create([
                'invoice_number' => DocumentNumber::next(Invoice::class, 'invoice_number', Carbon::parse($date)->format('Y-m') . '-', 4),
                'customer_id' => $c->id,
                'car_id' => $c->cars->first()->id,
                'date' => $date,
                'odometer' => rand(45, 190) * 1000,
                'status' => $status,
                'paid_amount' => $paid,
                'payment_method' => $method,
            ]);
            foreach ($labor as $l) {
                $invoice->laborItems()->create($l);
            }
            foreach ($parts as $p) {
                $invoice->partItems()->create($p);
            }
            $invoice->load(['laborItems', 'partItems']);
            $invoice->recalculateTotals();
            $invoice->save();

            return $invoice;
        };

        $s0 = $suppliers[0]->id;
        $s1 = $suppliers[1]->id;
        $s2 = $suppliers[2]->id;

        // محمد العلي — كامري: فحص شامل، دفع جزئي (دين)
        $mk($customers[0], '2026-08-03', 'ready',
            [['department' => 'mechanic', 'description' => 'تغيير زيت وفلاتر', 'amount' => 120000],
             ['department' => 'electrical', 'description' => 'إصلاح دينمو', 'amount' => 90000]],
            [['supplier_id' => $s0, 'name' => 'فلتر زيت', 'buy_price' => 25000, 'sell_price' => 40000, 'quantity' => 1],
             ['supplier_id' => $s1, 'name' => 'زيت محرك 4 لتر', 'buy_price' => 180000, 'sell_price' => 240000, 'quantity' => 1]],
            300000, 'cash');

        // مرح ضاهر — سبورتاج: دوزان وميزان، مدفوع كامل
        $mk($customers[1], '2026-08-06', 'ready',
            [['department' => 'dozan', 'description' => 'ميزان وترصيص', 'amount' => 80000]],
            [['supplier_id' => $s2, 'name' => 'إطار 225/60', 'buy_price' => 350000, 'sell_price' => 460000, 'quantity' => 2]],
            1000000, 'network');

        // أحمد الخطيب — مرسيدس: كهرباء، دين كبير
        $mk($customers[2], '2026-08-10', 'repairing',
            [['department' => 'electrical', 'description' => 'إصلاح كمبيوتر السيارة', 'amount' => 450000],
             ['department' => 'mechanic', 'description' => 'تغيير بواجي', 'amount' => 150000]],
            [['supplier_id' => $s0, 'name' => 'طقم بواجي', 'buy_price' => 120000, 'sell_price' => 180000, 'quantity' => 1]],
            200000, 'cash');

        // سامر حداد — صني: ميكانيك بسيط، مدفوع
        $mk($customers[3], '2026-08-12', 'ready',
            [['department' => 'mechanic', 'description' => 'تغيير فحمات فرامل', 'amount' => 95000]],
            [['supplier_id' => $s0, 'name' => 'فحمات أمامية', 'buy_price' => 60000, 'sell_price' => 95000, 'quantity' => 1]],
            190000, 'cash');

        // ريم قاسم — ريو: قيد الفحص
        $mk($customers[4], '2026-08-18', 'inspecting',
            [['department' => 'mechanic', 'description' => 'فحص تكييف', 'amount' => 60000]],
            [],
            0, null);

        // خالد إبراهيم — BMW: صيانة كبيرة، دين
        $mk($customers[5], '2026-08-20', 'repairing',
            [['department' => 'mechanic', 'description' => 'تغيير طقم توزيع', 'amount' => 350000],
             ['department' => 'electrical', 'description' => 'فحص حساسات', 'amount' => 120000]],
            [['supplier_id' => $s1, 'name' => 'طقم سير توزيع', 'buy_price' => 400000, 'sell_price' => 550000, 'quantity' => 1],
             ['supplier_id' => $s0, 'name' => 'مضخة ماء', 'buy_price' => 150000, 'sell_price' => 220000, 'quantity' => 1]],
            500000, 'network');

        // لينا سعيد — كورولا: خدمة سريعة مدفوعة
        $mk($customers[6], '2026-08-24', 'ready',
            [['department' => 'mechanic', 'description' => 'تغيير زيت', 'amount' => 70000]],
            [['supplier_id' => $s1, 'name' => 'زيت محرك', 'buy_price' => 160000, 'sell_price' => 210000, 'quantity' => 1]],
            280000, 'cash');

        // محمد العلي — النترا: زيارة ثانية، دين
        $mk($customers[0], '2026-08-25', 'ready',
            [['department' => 'electrical', 'description' => 'إصلاح مكيف', 'amount' => 180000]],
            [['supplier_id' => $s0, 'name' => 'كومبروسر مكيف', 'buy_price' => 300000, 'sell_price' => 420000, 'quantity' => 1]],
            100000, 'cash');

        $s3 = $suppliers[3]->id;

        // عمر ناصر — سيفيك: ميكانيك + كهرباء، دين
        $mk($customers[7], '2026-08-05', 'ready',
            [['department' => 'mechanic', 'description' => 'تغيير سير مكيف', 'amount' => 85000],
             ['department' => 'electrical', 'description' => 'إصلاح إضاءة', 'amount' => 55000]],
            [['supplier_id' => $s1, 'name' => 'سير مكيف', 'buy_price' => 45000, 'sell_price' => 70000, 'quantity' => 1]],
            120000, 'cash');

        // ياسمين حلبي — ميغان: مدفوع كامل
        $mk($customers[8], '2026-08-08', 'ready',
            [['department' => 'mechanic', 'description' => 'صيانة دورية', 'amount' => 130000]],
            [['supplier_id' => $s1, 'name' => 'فلاتر كاملة', 'buy_price' => 90000, 'sell_price' => 140000, 'quantity' => 1]],
            270000, 'network');

        // طارق منصور — فوكس: قيد الفحص
        $mk($customers[9], '2026-08-14', 'inspecting',
            [['department' => 'electrical', 'description' => 'فحص أعطال كهربائية', 'amount' => 70000]],
            [], 0, null);

        // رامي العبدالله — أوبترا: دوزان + ميكانيك، دين
        $mk($customers[11], '2026-08-19', 'ready',
            [['department' => 'dozan', 'description' => 'ميزان زوايا', 'amount' => 65000],
             ['department' => 'mechanic', 'description' => 'تغيير مساعدين', 'amount' => 140000]],
            [['supplier_id' => $s0, 'name' => 'مساعدين أمامي', 'buy_price' => 160000, 'sell_price' => 230000, 'quantity' => 2]],
            300000, 'cash');

        // هالة يوسف — بيجو: قيد الإصلاح، دين كبير
        $mk($customers[12], '2026-08-16', 'repairing',
            [['department' => 'mechanic', 'description' => 'إصلاح علبة سرعة', 'amount' => 550000]],
            [['supplier_id' => $s3, 'name' => 'طقم إصلاح جير', 'buy_price' => 380000, 'sell_price' => 520000, 'quantity' => 1]],
            400000, 'network');

        // بشار الأحمد — سوناتا: كهرباء + قطع، دين
        $mk($customers[15], '2026-08-21', 'ready',
            [['department' => 'electrical', 'description' => 'تغيير بطارية وفحص شحن', 'amount' => 60000]],
            [['supplier_id' => $s2, 'name' => 'بطارية 70 أمبير', 'buy_price' => 220000, 'sell_price' => 300000, 'quantity' => 1]],
            150000, 'cash');

        // ديمة الحسن — سيراتو: مدفوع
        $mk($customers[14], '2026-08-23', 'ready',
            [['department' => 'mechanic', 'description' => 'تغيير زيت وفلتر', 'amount' => 75000]],
            [['supplier_id' => $s1, 'name' => 'زيت + فلتر', 'buy_price' => 150000, 'sell_price' => 200000, 'quantity' => 1]],
            275000, 'network');

        // ---- Payments (receipts against debts) ----
        Payment::create([
            'receipt_number' => DocumentNumber::next(Payment::class, 'receipt_number', 'RC-2026-08-', 4),
            'customer_id' => $customers[0]->id, 'amount' => 150000, 'method' => 'cash', 'date' => '2026-08-15', 'note' => 'دفعة على الحساب',
        ]);
        Payment::create([
            'receipt_number' => DocumentNumber::next(Payment::class, 'receipt_number', 'RC-2026-08-', 4),
            'customer_id' => $customers[2]->id, 'amount' => 300000, 'method' => 'network', 'date' => '2026-08-22', 'note' => 'دفعة أولى',
        ]);
        Payment::create([
            'receipt_number' => DocumentNumber::next(Payment::class, 'receipt_number', 'RC-2026-08-', 4),
            'customer_id' => $customers[12]->id, 'amount' => 200000, 'method' => 'cash', 'date' => '2026-08-24', 'note' => 'دفعة على إصلاح الجير',
        ]);
        Payment::create([
            'receipt_number' => DocumentNumber::next(Payment::class, 'receipt_number', 'RC-2026-08-', 4),
            'customer_id' => $customers[7]->id, 'amount' => 50000, 'method' => 'cash', 'date' => '2026-08-25', 'note' => 'دفعة',
        ]);
    }
}

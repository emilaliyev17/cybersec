import BonusCalculatorTable from './BonusCalculatorTable';

export default function BonusCalculator() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Comp Data + Bonus Pool</h2>
          <p className="text-sm text-gray-400 mt-1">Interactive bonus pool calculator</p>
        </div>
      </div>
      <BonusCalculatorTable />
    </div>
  );
}

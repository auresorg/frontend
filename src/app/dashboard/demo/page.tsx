'use client';

import { useState } from 'react';
import { RiCloseLine, RiDownloadLine, RiSendPlaneLine } from '@remixicon/react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog';
import { Divider } from '@/components/Divider';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';

// Define types
type ProjectItem = {
  id: number;
  name: string;
  role: string;
};

type CertificationItem = {
  id: number;
  name: string;
  issuer: string;
};

type AwardItem = {
  id: number;
  name: string;
  year: string;
};

type ExperienceItem = {
  id: number;
  name: string;
  company: string;
};

type ItemType = 'projects' | 'certifications' | 'awards' | 'experiences';

type SelectedItem = {
  id: number;
  name: string;
  type: ItemType;
  role?: string;
  issuer?: string;
  year?: string;
  company?: string;
};

type SelectionSectionProps = {
  title: string;
  data: (ProjectItem | CertificationItem | AwardItem | ExperienceItem)[];
  selectedItems: SelectedItem[];
  onSelect: (item: ProjectItem | CertificationItem | AwardItem | ExperienceItem, type: ItemType) => void;
  type: ItemType;
};

// Sample data
const projectsData: ProjectItem[] = [
  { id: 1, name: 'E-Commerce Platform', role: 'Fullstack' },
  { id: 2, name: 'AI Chatbot', role: 'AIML' },
  { id: 3, name: 'Mobile Banking App', role: 'Frontend' },
  { id: 4, name: 'CRM System', role: 'Backend' },
  { id: 5, name: 'Analytics Dashboard', role: 'Fullstack' },
  { id: 6, name: 'IoT Monitoring System', role: 'Embedded' },
  { id: 7, name: 'Blockchain Wallet', role: 'Blockchain' },
  { id: 8, name: 'Healthcare Platform', role: 'Fullstack' },
  { id: 9, name: 'Social Media App', role: 'Mobile' },
  { id: 10, name: 'Payment Gateway', role: 'Backend' },
];

const certificationsData: CertificationItem[] = [
  { id: 1, name: 'AWS Solutions Architect', issuer: 'Amazon Web Services' },
  { id: 2, name: 'Google Cloud Professional', issuer: 'Google Cloud' },
  { id: 3, name: 'React Developer', issuer: 'Meta' },
  { id: 4, name: 'Kubernetes Administrator', issuer: 'CNCF' },
  { id: 5, name: 'Data Science Specialization', issuer: 'Coursera' },
  { id: 6, name: 'Security+', issuer: 'CompTIA' },
  { id: 7, name: 'Scrum Master', issuer: 'Scrum Alliance' },
  { id: 8, name: 'Python Developer', issuer: 'Python Institute' },
  { id: 9, name: 'Azure Fundamentals', issuer: 'Microsoft' },
  { id: 10, name: 'Docker Certified', issuer: 'Docker Inc.' },
];

const awardsData: AwardItem[] = [
  { id: 1, name: 'Best Innovation Award', year: '2023' },
  { id: 2, name: 'Employee of the Year', year: '2022' },
  { id: 3, name: 'Hackathon Winner', year: '2023' },
  { id: 4, name: 'Open Source Contributor', year: '2024' },
  { id: 5, name: 'Tech Excellence Award', year: '2021' },
  { id: 6, name: 'Leadership Award', year: '2022' },
  { id: 7, name: 'Innovation Grant', year: '2023' },
  { id: 8, name: 'Best Project Award', year: '2024' },
  { id: 9, name: 'Code Quality Award', year: '2023' },
  { id: 10, name: 'Customer Satisfaction', year: '2024' },
];

const experiencesData: ExperienceItem[] = [
  { id: 1, name: 'Senior Software Engineer', company: 'Tech Corp Inc.' },
  { id: 2, name: 'Fullstack Developer', company: 'Startup XYZ' },
  { id: 3, name: 'Backend Engineer', company: 'Finance Solutions' },
  { id: 4, name: 'DevOps Specialist', company: 'Cloud Services Co.' },
  { id: 5, name: 'Team Lead', company: 'Product Innovations' },
  { id: 6, name: 'Software Architect', company: 'Enterprise Solutions' },
  { id: 7, name: 'ML Engineer', company: 'AI Research Lab' },
  { id: 8, name: 'Mobile Developer', company: 'App Creators Inc.' },
  { id: 9, name: 'Frontend Lead', company: 'Design Studio' },
  { id: 10, name: 'System Admin', company: 'IT Solutions' },
];

// Selection Component
function SelectionSection({ title, data, selectedItems, onSelect, type }: SelectionSectionProps) {
  const selectedCount = selectedItems.filter(item => item.type === type).length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {title}
          </Text>
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-50">
            {data.length}
          </span>
        </div>
        {selectedCount > 0 && (
          <Text className="text-sm text-blue-600 dark:text-blue-400">
            {selectedCount} selected
          </Text>
        )}
      </div>
      <Divider className="my-2!" />
      <div className="relative">
        <div className="flex space-x-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
          {data.map((item) => {
            const isSelected = selectedItems.some((selected: SelectedItem) => selected.id === item.id && selected.type === type);
            return (
              <Card
                key={item.id}
                asChild
                className={`group min-w-[180px] max-w-[180px] cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                onClick={() => onSelect(item, type)}
              >
                <div className="relative p-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <Text className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                        {item.name}
                      </Text>
                      <Text className="truncate text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        {'role' in item && item.role}
                        {'issuer' in item && item.issuer}
                        {'year' in item && item.year}
                        {'company' in item && item.company}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main Dialog Component
export default function CustomResumeDialog() {
  const [slug, setSlug] = useState('my-custom-resume');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = (item: ProjectItem | CertificationItem | AwardItem | ExperienceItem, type: ItemType) => {
    setSelectedItems(prev => {
      const exists = prev.some((selected: SelectedItem) => selected.id === item.id && selected.type === type);
      if (exists) {
        return prev.filter((selected: SelectedItem) => !(selected.id === item.id && selected.type === type));
      } else {
        const newItem: SelectedItem = {
          ...item,
          type
        };
        return [...prev, newItem];
      }
    });
  };

  const handleDeploy = () => {
    // Deploy logic here
    console.log('Deploying resume with slug:', slug);
    console.log('Selected items:', selectedItems);
    alert('Resume deployed successfully!');
  };

  const handleDownload = () => {
    // Download logic here
    console.log('Downloading resume with slug:', slug);
    console.log('Selected items:', selectedItems);
    alert('Resume downloaded successfully!');
  };

  return (
    <div className="obfuscate">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Create Custom Resume</Button>
        </DialogTrigger>
        <DialogContent className="p-0! sm:max-w-7xl">
          <DialogClose asChild>
            <Button
              className="absolute! right-3! top-3! z-50! p-2! text-gray-400! hover:text-gray-500! dark:text-gray-600! hover:dark:text-gray-500!"
              variant="ghost"
            >
              <RiCloseLine className="size-5 shrink-0" />
            </Button>
          </DialogClose>
          
          <DialogHeader className="border-b border-gray-200 px-6 py-4 dark:border-gray-900">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-base font-medium text-gray-900 dark:text-gray-50">
                Create Custom Resume
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex h-[calc(100vh-150px)] flex-col">
            {/* Slug and Actions */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-900">
              <div className="flex flex-1 items-center space-x-4">
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  Slug:
                </Text>
                <div className="flex-1">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="resume-slug"
                    className="w-full max-w-md"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleDeploy}
                  className="flex items-center space-x-2"
                >
                  <RiSendPlaneLine className="size-4" />
                  <span>Deploy</span>
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex items-center space-x-2"
                >
                  <RiDownloadLine className="size-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
              <div className="space-y-6">
                <SelectionSection
                  title="Projects"
                  data={projectsData}
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  type="projects"
                />

                <SelectionSection
                  title="Certifications"
                  data={certificationsData}
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  type="certifications"
                />

                <SelectionSection
                  title="Awards"
                  data={awardsData}
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  type="awards"
                />

                <SelectionSection
                  title="Experiences"
                  data={experiencesData}
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  type="experiences"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}